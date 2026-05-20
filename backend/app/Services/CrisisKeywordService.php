<?php

namespace App\Services;

class CrisisKeywordService
{
    /**
     * Keywords/phrases that indicate potential crisis or distress.
     * Grouped by severity level.
     */
    private const KEYWORDS = [
        'high' => [
            'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
            'better off dead', 'no reason to live', 'not worth living',
            'ending it all', 'say goodbye', 'final goodbye',
            'self harm', 'self-harm', 'cutting myself', 'hurt myself',
            'overdose', 'hang myself', 'jump off',
        ],
        'medium' => [
            'hopeless', 'worthless', 'can\'t go on', 'give up on life',
            'no one cares', 'burden to everyone', 'hate my life',
            'wish i was dead', 'wish i wasn\'t here', 'disappear forever',
            'can\'t take it anymore', 'breaking down', 'falling apart',
            'don\'t want to be here', 'tired of living', 'done with everything',
            'nobody would miss me', 'world without me',
        ],
        'low' => [
            'depressed', 'depression', 'anxious', 'anxiety', 'lonely',
            'isolated', 'overwhelmed', 'struggling', 'help me',
            'crying', 'empty inside', 'numb', 'lost', 'stuck',
            'can\'t sleep', 'panic attack', 'breakdown',
        ],
    ];

    /**
     * Crisis helpline information.
     */
    private const HELPLINES = [
        ['name' => 'National Suicide Prevention Lifeline', 'number' => '988', 'available' => '24/7'],
        ['name' => 'Crisis Text Line', 'number' => 'Text HOME to 741741', 'available' => '24/7'],
        ['name' => 'International Association for Suicide Prevention', 'number' => 'https://www.iasp.info/resources/Crisis_Centres/', 'available' => 'Varies by country'],
    ];

    /**
     * Check content for crisis keywords.
     *
     * @return array{matched: bool, severity: string|null, keywords: string[]}
     */
    public static function check(string $content): array
    {
        $normalizedContent = strtolower(trim($content));

        foreach (self::KEYWORDS as $severity => $keywords) {
            $matched = [];
            foreach ($keywords as $keyword) {
                if (str_contains($normalizedContent, $keyword)) {
                    $matched[] = $keyword;
                }
            }

            if (!empty($matched)) {
                return [
                    'matched' => true,
                    'severity' => $severity,
                    'keywords' => $matched,
                ];
            }
        }

        return [
            'matched' => false,
            'severity' => null,
            'keywords' => [],
        ];
    }

    /**
     * Get helpline information for crisis response.
     */
    public static function getHelplines(): array
    {
        return self::HELPLINES;
    }
}
