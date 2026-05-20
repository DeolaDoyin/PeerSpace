<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AcademicEmail implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!preg_match('/(\.edu|\.ac\.uk)$/i', $value)) {
            $fail('The :attribute must be a valid academic email address (e.g., .edu or .ac.uk).');
        }
    }
}
