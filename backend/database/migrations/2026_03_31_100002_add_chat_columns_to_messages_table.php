<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('chat_id')->after('id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->after('chat_id')->constrained()->cascadeOnDelete();
            
            // 💡 E2EE CHANGES: Swap out plaintext 'body' for encrypted data storage
            $table->text('encrypted_payload')->after('user_id'); // Holds the encrypted base64 string
            $table->string('iv')->after('encrypted_payload');    // Holds the unique 12-byte initialization vector
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['chat_id']);
            $table->dropForeign(['user_id']);
            
            // 💡 Roll back the exact E2EE encryption columns
            $table->dropColumn(['chat_id', 'user_id', 'encrypted_payload', 'iv']);
        });
    }
};