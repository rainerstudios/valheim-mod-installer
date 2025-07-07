<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Egg;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Enums\ValheimModStatus;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\ValheimModInstalling;
use Pterodactyl\Models\ValheimModsInstalled;
use Pterodactyl\Services\Servers\ValheimModsService;
use Pterodactyl\Jobs\Valheim\CollectModDependenciesJob;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Http\Requests\Api\Client\Servers\Valheim\ValheimModsRequest;
use Pterodactyl\Http\Requests\Api\Client\Servers\Valheim\ValheimChangeModeRequest;

class ValheimModsController extends ClientApiController
{
    public const VALHEIM_EGG_IDS = [16, 18, 19];

    public const VALHEIM_VANILLA_EGG_IDS = 16;

    public const VALHEIM_BEPINEX_EGG_IDS = 19;

    /**
     * @param ValheimModsService $valheimModsService
     * @param DaemonFileRepository $daemonFileRepository
     */
    public function __construct(private ValheimModsService $valheimModsService, private DaemonFileRepository $daemonFileRepository)
    {
        parent::__construct();
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @return array
     * @throws DisplayException
     */
    public function index(ValheimModsRequest $request, Server $server)
    {
        return [
            'mode' => $server->egg_id == self::VALHEIM_BEPINEX_EGG_IDS
                ? 'bepinex'
                : 'vanilla',
            'installing' => $this->valheimModsService->isInstallInProgress($server),
            'installing_status' => $server->installingValheimMods()->whereNull('installing_parent_id')->first()->status ?? null,
        ];
    }

    /**
     * @param ValheimChangeModeRequest $request
     * @param Server $server
     * @return Response
     * @throws DisplayException
     * @throws \Throwable
     */
    public function switch(ValheimChangeModeRequest $request, Server $server)
    {
        // Call the mode switch service
        try {
            $this->valheimModsService->switchMode(
                $server,
                $request->input('mode') == 'vanilla'
                    ? Egg::where('id', '=', self::VALHEIM_VANILLA_EGG_IDS)->first()
                    : Egg::where('id', '=', self::VALHEIM_BEPINEX_EGG_IDS)->first()
            );
        } catch (\Exception $e) {
            throw new DisplayException($e->getMessage());
        }

        // Save to logs
        Activity::event('server:valheim-mods.switch-mode')
            ->property('to', $request->input('mode'))
            ->log();

        return response()->noContent();
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @return array
     * @throws DisplayException
     */
    public function search(ValheimModsRequest $request, Server $server)
    {
        // Fetch mods
        $mods_response = $this->valheimModsService->curl(
            'GET',
            sprintf(
                '/api/mods/?page=%s&count=%s&show_deprecated=%s&show_nsfw=%s%s',
                (int) $request->input('page', 1),
                12,
                $request->input('show_deprecated', 'false'),
                $request->input('show_nsfw', 'false'),
                (empty($request->input('query', ''))
                    ? ''
                    : '&query=' . urlencode(trim(strip_tags($request->input('query'))))),
            )
        );

        // Validate mods
        if (!isset($mods_response['data']) || !isset($mods_response['pagination'])) {
            throw new DisplayException('Failed to fetch the mods.');
        }

        // Loop in mods to fetch latest versions
        foreach ($mods_response['data'] as $key => $mod) {
            $version_response = $this->valheimModsService->curl('GET', sprintf('/api/mods/%s/versions/latest', $mod['uuid4']));

            if (!isset($version_response['attributes'])) {
                unset($mods_response['data'][$key]);

                continue;
            }

            $mods_response['data'][$key]['versions'] = [];
            $mods_response['data'][$key]['versions'][] = $version_response['attributes'];
        }

        return [
            'mods' => $mods_response['data'],
            'pagination' => $mods_response['pagination'],
        ];
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @param $mod_uuid4
     * @return array
     * @throws DisplayException
     */
    public function versions(ValheimModsRequest $request, Server $server, $mod_uuid4)
    {
        // Fetch versions
        $versions_response = $this->valheimModsService->curl('GET', sprintf('/api/mods/%s/versions?page=%s&count=8', $mod_uuid4, (int) $request->input('page', 1)));

        // Validate response
        if (!isset($versions_response['data']) || !isset($versions_response['pagination'])) {
            throw new DisplayException('Failed to fetch the versions.');
        }

        return [
            'versions' => $versions_response['data'],
            'pagination' => $versions_response['pagination'],
        ];
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @return array[]
     */
    public function installedMods(ValheimModsRequest $request, Server $server)
    {
        // Collect installed mods
        $mods = [];

        // Loop in parent installed mods
        foreach ($server->installedValheimMods()->whereNull('installing_parent_id')->get() as $mod) {
            // Fetch mod data
            $mod_response = $this->valheimModsService->curl('GET', sprintf('/api/mods/%s', $mod->mod_uuid4));

            // Skip if not found
            if (!isset($mod_response['attributes'])) {
                continue;
            }

            // Fetch related version
            $version_response = $this->valheimModsService->curl('GET', sprintf('/api/mods/%s/versions/%s', $mod->mod_uuid4, $mod->version_uuid4));

            // Verify
            if (!isset($version_response['attributes'])) {
                continue;
            }

            $mod_response['attributes']['versions'] = [];
            $mod_response['attributes']['versions'][] = $version_response['attributes'];

            // Append dependency count
            $mod_response['attributes']['dependency_count'] = $server->installedValheimMods()->where('installing_parent_id', '=', $mod->id)->count();

            $mods[] = $mod_response['attributes'];
        }

        return [
            'mods' => $mods,
        ];
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @param $mod_uuid4
     * @param $version_uuid4
     * @return Response
     * @throws DisplayException
     */
    public function install(ValheimModsRequest $request, Server $server, $mod_uuid4, $version_uuid4)
    {
        // Fetch mod and version
        $mod_response = $this->valheimModsService->curl('GET', sprintf('/api/mods/%s', $mod_uuid4));
        $version_response = $this->valheimModsService->curl('GET', sprintf('/api/mods/%s/versions/%s', $mod_uuid4, $version_uuid4));

        // Validate response
        if (!isset($mod_response['attributes']) || !isset($version_response['attributes'])) {
            throw new DisplayException('Failed to fetch the selected versions.');
        }

        // Disable bepinex and r2modman
        if (in_array($mod_response['attributes']['name'], ['r2modman', 'BepInExPack_Valheim'])) {
            throw new DisplayException(match ($mod_response['attributes']['name']) {
                'r2modman' => 'r2modman is not available for installing.',
                'BepInExPack_Valheim' => 'BepInEx can be installed with the version switch above.',
            });
        }

        // Verify currently installing
        if ($server->installingValheimMods()->count() > 0) {
            throw new DisplayException('There is another install process already running. Please wait until finish or cancel it to continue.');
        }

        // Verify for already installed
        if ($server->installedValheimMods()->where('id', '=', sprintf('s_%s-m_%s', $server->id, $version_response['attributes']['mod_uuid4']))->exists()) {
            throw new DisplayException('This mod is already installed to this server, firstly please uninstall it.');
        }

        // Create installing record
        $installing_mod = ValheimModInstalling::create([
            'id' => sprintf('s_%s-m_%s', $server->id, $version_response['attributes']['mod_uuid4']),
            'installing_parent_id' => null,
            'server_id' => $server->id,
            'mod_uuid4' => $version_response['attributes']['mod_uuid4'],
            'version_uuid4' => $version_response['attributes']['uuid4'],
            'download_url' => $version_response['attributes']['download_url'],
        ]);

        // Dispatch the collect job
        CollectModDependenciesJob::dispatch($installing_mod);

        // Save to logs
        Activity::event('server:valheim-mods.install-mod')
            ->property('mod_uuid4', $installing_mod->mod_uuid4)
            ->property('mod_name', $mod_response['attributes']['name'])
            ->log();

        return response()->noContent();
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @return Response
     * @throws DisplayException
     */
    public function cancel(ValheimModsRequest $request, Server $server)
    {
        // Search for install
        $install = $server->installingValheimMods()->whereNull('installing_parent_id')->first();

        // Install in-progress?
        if (!$install) {
            throw new DisplayException('There are no install in progress for this server.');
        }

        // Check for status
        if ($install->status != ValheimModStatus::FAILED) {
            throw new DisplayException('You can only cancel failed installations.');
        }

        // Delete all install
        $server->installingValheimMods()->delete();

        return response()->noContent();
    }

    /**
     * @param ValheimModsRequest $request
     * @param Server $server
     * @param ValheimModsInstalled $installed_valheim_mod
     * @return Response
     * @throws DisplayException|\Throwable
     */
    public function uninstall(ValheimModsRequest $request, Server $server, ValheimModsInstalled $installed_valheim_mod)
    {
        // Deny if it has parent
        if (!is_null($installed_valheim_mod->installing_parent_id)) {
            throw new DisplayException('You can only uninstall whole mods.');
        }

        // Loop in files for deletion
        $files_for_deletion = [];
        foreach ($server->installedValheimMods()->where('id', '=', $installed_valheim_mod->id)->orWhere('installing_parent_id', '=', $installed_valheim_mod->id)->get() as $mod) {
            $files_for_deletion = array_merge($files_for_deletion, $mod->files);
        }

        // Only handle file delete endpoint if the mod contains any file
        if (count($files_for_deletion) > 0) {
            // Delete files
            try {
                $this->daemonFileRepository->setServer($server)->deleteFiles('/', $files_for_deletion);
            } catch (DaemonConnectionException $e) {
                throw new DisplayException('Failed to delete all mod files by the following issue: ' . $e->getMessage());
            }
        }

        // Delete the installed mods
        $server->installedValheimMods()->where('installing_parent_id', '=', $installed_valheim_mod->id)->delete();
        $installed_valheim_mod->delete();

        // Save to logs
        Activity::event('server:valheim-mods.uninstall-mod')
            ->property('mod_uuid4', $installed_valheim_mod->mod_uuid4)
            ->log();

        return response()->noContent();
    }
}
