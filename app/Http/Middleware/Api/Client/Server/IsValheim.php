<?php

namespace Pterodactyl\Http\Middleware\Api\Client\Server;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Pterodactyl\Http\Controllers\Api\Client\Servers\ValheimModsController;

class IsValheim
{
    /**
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $server = $request->attributes->get('server');

        if (!in_array($server->egg_id, ValheimModsController::VALHEIM_EGG_IDS)) {
            throw new NotFoundHttpException;
        }

        return $next($request);
    }
}
