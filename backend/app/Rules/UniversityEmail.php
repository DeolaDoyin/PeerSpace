<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniversityEmail implements ValidationRule
{
    /**
     * Known university email domain suffixes worldwide.
     */
    protected array $uniDomains = [
        '.edu',       // United States
        '.edu.au',    // Australia
        '.ac.uk',     // United Kingdom
        '.ac.za',     // South Africa
        '.edu.cn',    // China
        '.ac.jp',     // Japan
        '.ac.kr',     // South Korea
        '.edu.sg',    // Singapore
        '.edu.my',    // Malaysia
        '.edu.ph',    // Philippines
        '.edu.in',    // India
        '.ac.in',     // India
        '.edu.pk',    // Pakistan
        '.ac.nz',     // New Zealand
        '.edu.br',    // Brazil
        '.edu.mx',    // Mexico
        '.ac.ke',     // Kenya
        '.edu.gh',    // Ghana
        '.edu.ng',    // Nigeria
        '.ac.id',     // Indonesia
        '.edu.tr',    // Turkey
        '.edu.eg',    // Egypt
        '.ac.th',     // Thailand
        '.edu.co',    // Colombia
        '.edu.ar',    // Argentina
        '.ac.il',     // Israel
        '.edu.sa',    // Saudi Arabia
        '.ac.ae',     // UAE
        '.edu.ve',    // Venezuela
        '.edu.pe',    // Peru
        '.ac.ir',     // Iran
    ];

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $email = strtolower(trim($value));
        $domain = substr(strrchr($email, '@'), 1) ?: '';

        foreach ($this->uniDomains as $suffix) {
            if (str_ends_with($domain, $suffix)) {
                return;
            }
        }

        $fail('You must use a valid university email address.');
    }
}
