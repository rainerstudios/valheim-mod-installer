<?php

namespace Pterodactyl\Services\Servers;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Illuminate\Support\Collection;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Enums\ValheimModStatus;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\ValheimModInstalling;

class ValheimModsService
{
    public const API_URL = 'https://thunderstore.xgamingserver.com:8085';

    /**
     * @param ReinstallServerService $reinstallServerService
     * @param StartupModificationService $startupModificationService
     */
    public function __construct(
        private ReinstallServerService     $reinstallServerService,
        private StartupModificationService $startupModificationService
    )
    {
    }

    /**
     * @param Server $server
     * @param Egg $egg
     * @return void
     * @throws \Exception
     */
    public function switchMode(Server $server, Egg $egg): void
    {
        // Collect environment variables with default values
        $environment = $egg
            ->variables()
            ->get()
            ->keyBy('env_variable')
            ->map(fn (EggVariable $variable) => $variable->default_value)
            ->toArray();

        // Set user level to allow next, egg, startup change as-well
        $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);

        // Handle the egg change
        try {
            $this->startupModificationService->handle($server, [
                'nest_id' => $egg->nest_id,
                'egg_id' => $egg->id,
                'startup' => $egg->startup,
                'image' => array_values($egg->docker_images)[0],
                'environment' => $environment,
            ]);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to switch the server egg. Please try again...');
        }

        // Call the reinstall service
        try {
            $this->reinstallServerService->handle($server);
        } catch (\Throwable $e) {
            throw new \Exception('Failed to reinstall the server. Please reinstall it manually to apply the new mode.');
        }
    }

    /**
     * @param Server $server
     * @return mixed|null
     * @throws DisplayException
     */
    public function isInstallInProgress(Server $server): mixed
    {
        $install = $server
            ->installingValheimMods()
            ->whereNull('installing_parent_id')
            ->first();

        if (!$install) {
            return null;
        }

        // Fetch mod and version
        $mod_response = $this->curl('GET', sprintf('/api/mods/%s', $install->mod_uuid4));
        $version_response = $this->curl('GET', sprintf('/api/mods/%s/versions/%s', $install->mod_uuid4, $install->version_uuid4));

        // Verify responses
        if (!isset($mod_response['attributes']) || !isset($version_response['attributes'])) {
            throw new DisplayException('Failed to fetch the installing mod. Refresh the page, if it not solved, please contact with administrator.');
        }

        // Attach the installing version to versions
        $mod_response['attributes']['versions'][] = $version_response['attributes'];

        return $mod_response['attributes'];
    }

    /**
     * @param ValheimModInstalling $installing_mod
     * @return void
     */
    public function collectDependencies(ValheimModInstalling $installing_mod): void
    {
        // Empty dependency list to fill
        $dependencies = collect();

        // Fetch dependencies
        $this->dependencyCollection($installing_mod->mod_uuid4, $installing_mod->version_uuid4, $dependencies);

        // Loop in the dependencies and add to installing
        foreach ($dependencies->toArray() as $dependency) {
            // Fetch mod and version
            $version_response = $this->curl('GET', sprintf('/api/mods/%s/versions/%s', $dependency['mod_uuid4'], $dependency['version_uuid4']));

            // Validate response
            if (!isset($version_response['attributes'])) {
                continue;
            }

            // Check for already installed
            if ($installing_mod->server->installedValheimMods()->where('id', '=', sprintf('s_%s-m_%s', $installing_mod->server_id, $version_response['attributes']['mod_uuid4']))->exists()) {
                // Currently we're just skipping the already installed mods
                continue;
            }

            // Add as installing
            ValheimModInstalling::create([
                'id' => sprintf('s_%s-m_%s', $installing_mod->server_id, $version_response['attributes']['mod_uuid4']),
                'installing_parent_id' => $installing_mod->id,
                'server_id' => $installing_mod->server_id,
                'mod_uuid4' => $version_response['attributes']['mod_uuid4'],
                'version_uuid4' => $version_response['attributes']['uuid4'],
                'download_url' => $version_response['attributes']['download_url'],
            ]);
        }

        // Change status to downloading for parent and all mod
        ValheimModInstalling::where('id', '=', $installing_mod->id)->orwhere('installing_parent_id', '=', $installing_mod->id)->update([
            'status' => ValheimModStatus::DOWNLOADING,
        ]);
    }

    /**
     * @param $mod_uuid4
     * @param $version_uuid4
     * @param Collection $dependencies
     * @return void
     */
    private function dependencyCollection($mod_uuid4, $version_uuid4, Collection &$dependencies): void
    {
        // Fetch dependency list
        $dependency_list = $this->curl('GET', sprintf('/api/mods/%s/versions/%s/dependencies', $mod_uuid4, $version_uuid4));

        // Verify response
        if (!isset($dependency_list['data'])) {
            return;
        }

        // Add versions
        foreach ($dependency_list['data'] as $dependency) {
            // Ignore DepInEx and r2modman as dependency, because it is already installed
            if (in_array($dependency['mod_uuid4'], ['f21c391c-0bc5-431d-a233-95323b95e01b', 'c11edf2c-85d9-42ff-811b-139faa4c51b3'])) {
                continue;
            }

            // Skip the dependency if already added
            if ($dependencies->where('mod_uuid4', '=', $dependency['mod_uuid4'])->count() > 0) {
                continue;
            }

            // Collect dependencies' dependencies
            $this->dependencyCollection($dependency['mod_uuid4'], $dependency['version_uuid4'], $dependencies);

            // Add current as dependency
            $dependencies->push([
                'mod_uuid4' => $dependency['mod_uuid4'],
                'version_uuid4' => $dependency['version_uuid4'],
            ]);
        }
    }

    /**
     * Generates the download link list for the wings
     *
     * @param ValheimModInstalling $installing_mod
     * @return array
     */
    public function generateDownloadListFromInstalling(ValheimModInstalling $installing_mod): array
    {
        // Empty list for filling
        $downloading = [];

        // Loop in collected mods
        foreach (ValheimModInstalling::where('id', '=', $installing_mod->id)->orwhere('installing_parent_id', '=', $installing_mod->id)->get() as $download) {
            $downloading[] = [
                'id' => $download->id,
                'download_url' => $download->download_url,
            ];
        }

        return $downloading;
    }

    /**
     * @param $method
     * @param $url
     * @param array $body
     * @param array $headers
     * @return mixed
     */
    public function curl($method, $url, array $body = [], array $headers = []): mixed
    {
        $curl = curl_init();

        curl_setopt($curl, CURLOPT_URL, sprintf("%s%s", self::API_URL, $url));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($curl, CURLOPT_USERAGENT, 'Pterodactyl-1.x-ThunderstoreModManager');
        curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($curl, CURLOPT_TIMEOUT, 5);

        if (!empty($body)) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));

            $headers[] = 'Content-Type: application/json';
            $headers[] = 'Content-Length: ' . strlen(json_encode($body));
        }

        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($curl);

        return json_decode($response, true);
    }
}
