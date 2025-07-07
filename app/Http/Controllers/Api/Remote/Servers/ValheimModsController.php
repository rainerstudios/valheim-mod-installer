<?php

namespace Pterodactyl\Http\Controllers\Api\Remote\Servers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Enums\ValheimModStatus;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\ValheimModsInstalled;

class ValheimModsController extends Controller
{
    /**
     * @param Request $request
     * @param $uuid
     * @return JsonResponse|Response
     */
    public function installed(Request $request, $uuid)
    {
        // Fetch server
        $server = Server::where('uuid', '=', $uuid)->first();
        if (!$server) {
            return response()->json(['Success' => false, 'Error' => 'Server not found.']);
        }

        // Copy installing mods to installed
        foreach ($server->installingValheimMods()->orderBy('installing_parent_id', 'ASC')->get() as $mod) {
            ValheimModsInstalled::create([
                'id' => $mod->id,
                'installing_parent_id' => $mod->installing_parent_id,
                'server_id' => $server->id,
                'mod_uuid4' => $mod->mod_uuid4,
                'version_uuid4' => $mod->version_uuid4,
                'status' => ValheimModStatus::INSTALLED,
                'files' => [],
            ]);
        }

        // Loop in mods
        foreach ($request->input('files', []) as $mod_id => $files) {
            // Search for the provided mods in the installing mods
            $mod = $server->installedValheimMods()->where('id', '=', $mod_id)->first();
            if (!$mod) {
                continue;
            }

            // Save files
            $mod->update([
                'files' => $files,
            ]);
        }

        // Delete installing mods
        $server->installingValheimMods()->whereNotNull('installing_parent_id')->delete();
        $server->installingValheimMods()->delete();

        return response()->noContent();
    }
}
