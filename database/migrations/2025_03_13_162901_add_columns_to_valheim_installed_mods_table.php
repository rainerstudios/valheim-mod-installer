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
        Schema::table('valheim_installed_mods', function (Blueprint $table) {
            $table->text('files')->after('status');
            $table->string('installing_parent_id')->nullable()->after('id');
        });

        Schema::table('valheim_installed_mods', function (Blueprint $table) {
            $table->foreign('installing_parent_id')->references('id')->on('valheim_installed_mods');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('valheim_installed_mods', function (Blueprint $table) {
            $table->dropForeign('valheim_installed_mods_installing_parent_id_foreign');

            $table->dropColumn('files');
            $table->dropColumn('installing_parent_id');
        });
    }
};
