<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Pterodactyl\Enums\ValheimModStatus;

class ValheimModsInstalled extends Model
{
    /**
     * @var string
     */
    protected $table = 'valheim_installed_mods';

    /**
     * @var bool
     */
    public $incrementing = false;

    /**
     * @var string[]
     */
    protected $fillable = [
        'id',
        'installing_parent_id',
        'server_id',
        'mod_uuid4',
        'version_uuid4',
        'status',
        'files',
    ];

    /**
     * @var string[]
     */
    protected $casts = [
        'files' => 'array',
    ];

    /**
     * @var array
     */
    protected $attributes = [
        'status' => ValheimModStatus::INSTALLED,
    ];
}
