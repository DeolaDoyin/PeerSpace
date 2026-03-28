<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RedditAliasService
{
    public static function getNewAlias(): string
    {
        try {
            // Fetch the list from Reddit
            $response = Http::get('https://www.reddit.com/api/v1/generate_username.json');

            if ($response->successful()) {
                // Reddit returns: {"strings": ["Name1", "Name2", ...]}
                $data = $response->json();
                
                if (isset($data['strings']) && is_array($data['strings'])) {
                    // 1. Pick a random index from the array
                    $randomIndex = array_rand($data['strings']);
                    
                    // 2. Return just that one string
                    return $data['strings'][$randomIndex];
                }
            }
        } catch (\Exception $e) {
            Log::error("Reddit API Alias Generation failed: " . $e->getMessage());
        }

        // 3. Fallback: If Reddit is down, generate a "clean" local string
        $adjectives = ['Brave', 'Quiet', 'Resilient', 'Warm'];
        $nouns = ['Forest', 'River', 'Sparrow', 'Mountain'];
        
        return $adjectives[array_rand($adjectives)] . "-" . 
               $nouns[array_rand($nouns)] . "-" . 
               rand(1000, 9999);
    }
}