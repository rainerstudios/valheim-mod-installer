<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Valheim;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ValheimModsRequest extends ClientApiRequest
{
    /**
     * Determine if the API user has permission to perform this action.
     */
    public function permission(): string
    {
        return 'valheim-mods.manage';
    }
}
