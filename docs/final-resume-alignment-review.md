# Final résumé alignment review

Review branch: `update/final-resume-alignment`.

These changes are for review. Nothing has been merged into `main` or deployed.

## Changes by page

| Page or asset | Changes |
| --- | --- |
| `index.html` | Renamed the PayPal card and notebook highlight to **PayPal Financial Statement Forecast**. Changed the horizon to **4 quarter**, covering Q4 2025 to Q3 2026. Removed macroeconomic inputs, sensitivity work, and the claim that the project stress tested assumptions. Changed the headline revenue forecast MAPE to **0.9%**. Updated the notebook to Excel, 6 method comparison, Holt-Winters multiplicative, and full financial statement forecasting. Updated the value statement to the supplied within 2% result. Identified the LISC client as a Boston hair salon and labeled the 15 to 20% retention lift as a projection. Updated the healthcare finding, BBA qualification and GPA wording, and volunteer orientation dates. Updated the homepage description and Open Graph description. |
| `projects.html` | Corrected the PayPal title, 4 quarter horizon, SEC filings and PitchBook sources, Excel, course context, statement scope, ratio analysis, and DuPont analysis. Updated the healthcare card to the supplied finding. Updated the LISC card to the salon client and projected retention lift. |
| `projects/paypal-revenue-forecast.html` | Updated the page title, Open Graph title, description, Open Graph description, breadcrumb, heading, subtitle, project facts, methods, process, results, interpretation, limitations, and skill tags. Removed sensitivity analysis, macroeconomic data, the 12 quarter horizon, and outdated uncertainty about role, software, and final accuracy. Set dates to Sep 2025 to Dec 2025, type to individual Managerial Accounting course project, and tool to Excel. Listed the 5 supplied method names as examples of the 6 compared methods, with Holt-Winters multiplicative selected. Distinguished the 2.89% historical adjustment from the final 0.9% MAPE. Added the exact accuracy statement, quarterly results table, training data cutoff, and earnings release source note. Added full income statement, balance sheet, cash flow, ratio, and DuPont analysis. |
| `projects/hospital-performance-analytics.html` | Added the supplied finding about hospital size, revenue, and patient experience. Set the dates to Nov 2024 to Dec 2024. Retained Business Intelligence and Insights and PCA. Updated the description and Open Graph description. Updated the previous project link to the new PayPal title. |
| `projects/lisc-digital-growth-accelerator.html` | Specified a Boston hair salon, removed the IXL Business Consulting Program reference, and used LISC Digital Growth Accelerator consistently. Expanded the dates to Jun 2025 to Aug 2025. Kept 3rd of 36 and clearly labeled 15 to 20% retention as a projection. Updated the description and Open Graph description. Updated the next project link to the new PayPal title. |
| `experience.html` | Replaced the generic HackHult opening bullet with the supplied growth from 3 or 4 initial attendees to about 60 group chat members through posters and outreach. Retained Head of Marketing and Founding Board Member and Oct 2025 to May 2026. Removed IXL wording, specified the LISC salon client, and used Student Consultant as in the final résumé. Changed Orientation Leader dates to May to Sep 2024 and May to Sep 2025 and identified two summer intakes and volunteer service. Updated the full BBA title, GPA, all 6 Dean's List semesters, and Master of Finance date range. |
| `about.html` | Updated the full BBA title, GPA to 3.97/4.00, Dean's List to all 6 semesters, and Master of Finance date range to Sep 2026 to Sep 2027. |
| `skills.html` | Removed the sensitivity analysis row. Renamed all PayPal links. Updated the forecasting method skill to method comparison in Excel and Holt-Winters multiplicative. Added ratio and DuPont analysis, full financial statement forecasting, and a project evidence link for Excel. Updated the description and Open Graph description. |
| `achievements.html` | Updated the degree highlight to the full BBA title and added the supplied study dates, GPA, and all 6 Dean's List semesters. Updated Orientation Leader volunteer service dates to May to Sep 2025. Kept the source certificate's Fall 2025 title unchanged. |
| `credentials.html` | Updated the degree entry to the full BBA title and added study dates, GPA, and all 6 Dean's List semesters. Updated Orientation Leader volunteer service dates to May to Sep 2025. Kept the source certificate title and files unchanged. |
| `resume.html` | Removed the resolved TODO about the new PayPal horizon and accuracy. Replaced the downloadable PDF and Word files with the latest matching uploads, which add PitchBook data to the PayPal project. Updated preview and download cache tags. The uploaded files are preserved exactly. The earlier CORe discrepancy remains outside this correction list. |
| `assets/images/paypal-revenue-forecast.svg` | Replaced the retired decorative asset's “Forecasting / Sensitivity” text and accessible label with “Forecasting / Financial Statements”. Geometry is unchanged. The asset remains in the repository. |
| `assets/css/project-media.css` | Added responsive, horizontally contained table styling for the supplied quarterly results, with compact mobile cells and a grid sizing fix that prevents the table from widening the page. No new animation, dependency, or framework. |
| `assets/documents/ritsuko-yoshida-resume.pdf` and `.docx` | Replaced with the latest user supplied PDF and Word documents. Every Word paragraph was checked against the PDF text; the content matches. |

All 15 HTML pages, existing page titles, meta descriptions, structured metadata, navigation links, JavaScript text, and SVG text were searched. Unaffected pages and existing URLs were preserved.


## Supplied PayPal results

| Quarter | Reported ($M) | Forecast ($M) | Error |
| --- | ---: | ---: | ---: |
| Q4 2025 | 8,676 | 8,763 | 1.0% |
| Q1 2026 | 8,353 | 8,324 | 0.3% |
| Q2 2026 | 8,682 | 8,729 | 0.5% |
| Q3 2026 | 8,584 | 8,736 | 1.8% |

The user subsequently confirmed that PitchBook was also used, so SEC filings and PitchBook are both retained as data sources.

The table is transcribed from the user's instructions. The site says that the forecast was built in fall 2025 using data through Q3 2025 only and that actuals came from PayPal quarterly earnings releases. No figures were invented or independently substituted.

## Not found, so skipped

- A Japanese version, Japanese page titles, `12四半期`, or `感応度`.
- A custom LinkedIn preview image or `og:image` / `twitter:image` asset. Existing Open Graph titles and descriptions were updated where affected; no new preview image was invented.
- A 40% HackHult participation claim.
- A 90% Orientation Leader engagement claim.
- K-Means in the hospital project.
- PCA variance figures 43.35%, 26.60%, and 16.75%.
- About 9,000 customer visits for LISC.
- Power BI, NLP, or Corporate Finance in the current site text or current downloadable résumé text.
- The exact “MAPE + sensitivity” chip. Other sensitivity wording was present and removed.

The HackHult title and dates, hospital course name, and Master of Finance title already matched and were retained.

## Still needs confirmation

- **Sixth forecasting method:** six methods were specified, but only five names were supplied. The public page says “Methods included” before the five names and does not invent a sixth. A TODO is present in the case study HTML.
- The original hospital dataset citation is still unconfirmed. Its existing note remains.
- Existing source image questions, including the healthcare plot title mismatch and Build concept contribution percentage, are unchanged.
- The earlier CORe result and completion date discrepancy is unchanged because no new confirmation was supplied in this request.

## Validation

- Searched all 15 HTML pages, page titles, meta descriptions, Open Graph metadata, JavaScript text, SVG text, and both current résumé downloads for obsolete claims.
- Verified all four quarterly rows exactly against the supplied values. Verified that the rounded percentage errors and average MAPE agree with the supplied 0.9% result.
- Verified that the newly uploaded PDF and Word files are copied unchanged and contain matching résumé text.
- Ran the existing 45 page and viewport checks across all 15 pages at 1440, 768, and 390 pixels, including links, JavaScript errors, reveal visibility, motion persistence, reduced motion, and mobile menus.
- The initial sweep caught a new PayPal table overflow at 390 pixels. Fixed the table containment and grid sizing, then rechecked all six pages that load the affected stylesheet at all three widths. All passed, and all table columns fit at 390 pixels.
- Verified the updated PDF and Word downloads, forecast notebook, category filters, and new page/social metadata at all three widths.
- Existing layout shifts remain on `404.html` at 1440 pixels (0.00183) and `projects/visit-ready.html` at 390 pixels (0.04385). Those are separate from the corrected content and are not reported as passing zero shift checks.
- No live deployment or merge into `main` was performed.
