<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('valheim_installed_mods', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->integer('server_id')->unsigned();
            $table->char('mod_uuid4', 36);
            $table->char('version_uuid4', 36);
            $table->string('status', 16);
            $table->timestamps();

            $table->foreign('server_id')->references('id')->on('servers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('valheim_installed_mods');
    }
};
