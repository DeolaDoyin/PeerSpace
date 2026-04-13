<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('reports', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who reported
        $table->foreignId('post_id')->constrained()->onDelete('cascade'); // What was reported
        $table->text('reason')->nullable();
        $table->string('status')->default('pending'); // pending, reviewed, dismissed
        // For comments, you'd add a comment_id or use polymorphism
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
