<?php

namespace Pterodactyl\Jobs\Valheim;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Pterodactyl\Enums\ValheimModStatus;
use Illuminate\Queue\InteractsWithQueue;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Models\ValheimModInstalling;
use Pterodactyl\Services\Servers\ValheimModsService;
use Pterodactyl\Repositories\Wings\DaemonValheimRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class CollectModDependenciesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels, Queueable;

    /**
     * @var int
     */
    public int $tries = 3;

    /**
     * @var int
     */
    public int $timeout = 120;

    /**
     * @var ValheimModInstalling
     */
    private ValheimModInstalling $installing_mod;

    /**
     * @param ValheimModInstalling $installing_mod
     */
    public function __construct(ValheimModInstalling $installing_mod)
    {
        $this->installing_mod = $installing_mod->withoutRelations();

        $this->queue = 'standard';
    }

    /**
     * @param ValheimModsService $valheimModsService
     * @param DaemonValheimRepository $daemonValheimRepository
     * @return void
     * @throws GuzzleException
     * @throws DaemonConnectionException
     */
    public function handle(ValheimModsService $valheimModsService, DaemonValheimRepository $daemonValheimRepository): void
    {
        // Start the mod collection
        $valheimModsService->collectDependencies($this->installing_mod);

        // Send download start to wings
        $daemonValheimRepository
            ->setServer($this->installing_mod->server)
            ->install($valheimModsService->generateDownloadListFromInstalling($this->installing_mod));
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        // Update to failed all the mods
        ValheimModInstalling::query()
            ->where('id', '=', $this->installing_mod->id)
            ->orWhere('installing_parent_id', '=', $this->installing_mod->id)
            ->update([
                'status' => ValheimModStatus::FAILED,
            ]);
    }
}
