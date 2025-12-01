# SIYOU Mobile Performance Quick Wins Checklist

**Last Updated:** November 30, 2025

Use this checklist to implement the fastest, lowest-risk performance improvements.

---

## ✅ Priority 1: Immediate Actions (< 1 hour total)

### 1. Fix Image Sizes Attribute
- [ ] **File:** `snippets/card.liquid`
- [ ] **Time:** 30 minutes
- [ ] **Impact:** High (50-60% smaller images on mobile)

**Find all instances of:**
```liquid
sizes="(min-width: 1000px) 620px, 100vw"
```

**Replace with:**
```liquid
sizes="(max-width: 599px) 45vw, (max-width: 999px) 33vw, 20vw"
```

**Lines to check:** ~69, ~98, ~115, ~135

---

### 2. Add Missing Preconnects
- [ ] **File:** `layout/theme.liquid`
- [ ] **Time:** 5 minutes
- [ ] **Impact:** Medium (~980ms LCP savings)

**Add before `</head>`:**
```liquid
{%- comment -%} Performance: Third-party preconnects {%- endcomment -%}
<link rel="preconnect" href="https://wt.omnisendlink.com" crossorigin>
<link rel="preconnect" href="https://cdn-fe.meetchatty.com" crossorigin>
```

---

### 3. Fix Icon Font Display
- [ ] **File:** `layout/theme.liquid`
- [ ] **Line:** ~237
- [ ] **Time:** 2 minutes
- [ ] **Impact:** Low (better perceived performance)

**Find:**
```css
font-display: block;
```

**Replace with:**
```css
font-display: swap;
```

---

## 📊 Expected Results After Quick Wins

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Mobile Score | 54 | 58-62 | +4-8 |
| LCP | 12.6s | 11-12s | -1-2s |
| Image Payload | ~500KB | ~300KB | -40% |

---

## ⚠️ Testing Checklist

After each change:

- [ ] Test on mobile device (or Chrome DevTools mobile emulation)
- [ ] Check all product grid pages (collections, search results)
- [ ] Verify images load correctly at different viewport sizes
- [ ] Run PageSpeed Insights on mobile
- [ ] Check for console errors

---

## 📋 Next Steps (After Quick Wins)

See `MOBILE_PERFORMANCE_OPTIMIZATION_GUIDE.md` for:

1. **Tier 2:** Lazy-load Swiper, defer scripts (this month)
2. **Tier 3:** Replace Swiper with Embla, split CSS (this quarter)
3. **Long-term:** Theme migration considerations

---

## 🔗 Related Files

- `MOBILE_PERFORMANCE_OPTIMIZATION_GUIDE.md` - Full analysis
- `PERFORMANCE_ANALYSIS.md` - Original performance audit
- `CLAUDE.md` - Project context

---

*Quick wins can be implemented independently. No dependencies between tasks.*
