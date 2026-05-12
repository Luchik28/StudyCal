// Detect if text contains RTL characters (Arabic, Hebrew, Hindi, Persian, etc.)
export function isRTLText(text: string): boolean {
  if (!text) return false;

  // Unicode ranges for RTL scripts
  const rtlPattern = /[֐-ࣿༀ-࿿᐀-ᙿ -᚟ᚠ-ᛪ᛫-ᛮᛯ-ᛸᤀ-᥏ᥐ-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉᨀ-ᨛ᨞-᨟ᴀ-ᴥᴫ-ᵜᵢ-ᵥᵫ-ᵷᵹ-ᶚᶛ-ᶾḀ-ỿⁱ⁴₀-₉ₐ-ₜ℀-↉Ⰰ-Ⱞⰰ-ⱞⱠ-ⱿⲀ-ⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ々-〆〱-〵ゝ-ゞー-ヾㄅ-ㄯㄱ-ㆎ㆒-㆕ㆠ-ㆺㇰ-ㇿ㈠-㈩㉈-㉏㉑-㉟㊀-㊉㊱-㊿㐀-䶵一-鿯ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘫꙀ-꙯ꙴ-꙽ꙿ-꛱ꜗ-ꜟꜢ-ꞈꞋ-ꞮꞰ-ꞷꟷ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꣽꣾꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏ-꧙ꧠ-ꧤꧦ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵ-ꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭥꭰ-ꯢ꯰-꯹가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-﷽ﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ￨-￮￯-￸ء-ي]/g;

  return rtlPattern.test(text);
}

// Get text direction attribute
export function getTextDirection(text: string): 'ltr' | 'rtl' {
  return isRTLText(text) ? 'rtl' : 'ltr';
}
