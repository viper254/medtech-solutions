## 2025-05-14 - Transient Feedback for Clipboard Actions
**Learning:** Using native `alert()` for common actions like "Copy to Clipboard" is jarring and breaks the user's flow. A transient UI state (e.g., changing button text to "Copied!") provides immediate, non-blocking feedback that feels much smoother.
**Action:** Replace native `alert()` with temporary state changes or toast notifications for minor confirmation actions to maintain a seamless UX.
