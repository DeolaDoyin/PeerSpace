<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('category_id');
            $table->index('is_pinned');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('post_id');
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['is_pinned']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['post_id']);
            $table->dropIndex(['parent_id']);
        });
    }
};
