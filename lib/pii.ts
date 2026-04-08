export function maskPII(text: string) {
  const mapping: Record<string, string> = {};
  let maskedText = text;
  let counter = 1;

  // Mask Bank Accounts (e.g., 8-12 digits)
  const bankAccountRegex = /\b\d{8,12}\b/g;
  maskedText = maskedText.replace(bankAccountRegex, (match) => {
    if (!mapping[match]) {
      mapping[match] = `[BANK_ACCOUNT_${counter++}]`;
    }
    return mapping[match];
  });

  // Mask Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  maskedText = maskedText.replace(emailRegex, (match) => {
    if (!mapping[match]) {
      mapping[match] = `[EMAIL_${counter++}]`;
    }
    return mapping[match];
  });

  // Mask Names (Simple heuristic: Two capitalized words)
  // This is a naive NER for names
  const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  maskedText = maskedText.replace(nameRegex, (match) => {
    // Skip common non-names
    const skipList = ['Amazon Web', 'Web Services', 'Google Cloud', 'Slack Technologies', 'Uber For', 'For Business', 'Customer 1', 'Customer 2', 'Customer 3'];
    if (skipList.some(skip => match.includes(skip))) return match;
    
    if (!mapping[match]) {
      mapping[match] = `[PERSON_${counter++}]`;
    }
    return mapping[match];
  });

  return { maskedText, mapping };
}

export function unmaskPII(maskedText: string, mapping: Record<string, string>) {
  let unmaskedText = maskedText;
  // Reverse the mapping
  const reverseMapping = Object.entries(mapping).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {} as Record<string, string>);

  // Replace tokens with original values
  for (const [token, original] of Object.entries(reverseMapping)) {
    // Escape token for regex
    const escapedToken = token.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const regex = new RegExp(escapedToken, 'g');
    unmaskedText = unmaskedText.replace(regex, original as string);
  }

  return unmaskedText;
}
