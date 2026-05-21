<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        User::factory()->create([
            'name' => 'Admin User',
            'university' => 'Test University',
            'email' => 'admin@test.com',
            'password' => bcrypt('adminpassword'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Test User',
            'university' => 'Test University',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        User::factory()->create([
            'name' => 'Angry-River-5549',
            'university' => 'Test University',
            'email' => 'tester@example.com',
            'password' => bcrypt('wandering'),
        ]);

        $this->call([
            CategorySeeder::class,
            PostSeeder::class,
        ]);
    }
}
