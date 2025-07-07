<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Valheim;

use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class ValheimChangeModeRequest extends ClientApiRequest
{
    /**
     * Determine if the API user has permission to perform this action.
     */
    public function permission(): string
    {
        return 'valheim-mods.manage';
    }

    /**
     * @return array
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(['vanilla', 'bepinex'])]
        ];
    }
}
