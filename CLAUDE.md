# Chargeblast — Frontend Engineering Challenge

## Project objective

Build a production-quality recreation of the Stripe Payments Dashboard according to the official Chargeblast frontend engineering challenge.

The project must demonstrate exceptional visual fidelity, functional correctness, clean architecture, security awareness, accessibility, performance, and maintainability.

## Source of truth

- Official challenge document: `docs/references/challenge.pdf`
- Visual references: `docs/references/`
- The official challenge takes precedence over assumptions.
- Never silently omit requirements.
- Document ambiguities and technical decisions.

## Technology stack

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- TanStack Table
- Zod
- Vitest
- Playwright
- pnpm

Additional dependencies require a clear technical justification.

## Engineering principles

- Prefer simplicity over unnecessary abstraction.
- Follow SOLID, DRY and KISS principles pragmatically.
- Use feature-based architecture.
- Separate presentation, domain logic and data access.
- Prefer composition over inheritance.
- Write small, focused, reusable components.
- Avoid unnecessary dependencies.
- Never use `any`, `@ts-ignore` or unsafe type assertions to bypass errors without documented justification.
- Do not introduce dead code or unused imports.
- Avoid unnecessary comments and duplicated logic.
- Use descriptive and consistent naming.
- All code and documentation must be written in English.

## Visual fidelity

- Reproduce the Stripe reference as accurately as possible.
- Match typography, spacing, alignment, colors, borders, icons and interaction states.
- Do not introduce creative redesigns.
- Avoid generic component-library aesthetics.
- Validate the implementation using side-by-side screenshots.
- Include hover, focus, active, disabled and empty states.
- Preserve usability across viewport sizes.

## Financial data integrity

- Store monetary amounts as integer minor units.
- Use Intl APIs for currency and date formatting.
- Use deterministic synthetic data and stable identifiers.
- Never expose real financial or personal information.
- Validate payment records against explicit schemas.
- Document the semantics of sorting and filtering across currencies.
- Ensure consistent timezone handling.

## Security

- Treat all external input and URL parameters as untrusted.
- Validate inputs using Zod.
- Avoid dangerouslySetInnerHTML, eval and unsafe dynamic execution.
- Protect CSV exports against formula injection.
- Implement appropriate production security headers.
- Configure a compatible Content Security Policy without unnecessarily weakening protections.
- Never expose credentials or secrets.
- Audit dependencies for known vulnerabilities.
- Avoid unnecessary sensitive information in logs.
- Enforce sensible input and pagination limits.
- Do not implement unnecessary authentication, databases or payment integrations.
- Document relevant security assumptions and limitations.

## Accessibility

- Target WCAG 2.2 AA.
- Use semantic HTML.
- Implement accessible keyboard navigation.
- Provide visible focus indicators.
- Implement appropriate ARIA attributes.
- Never rely exclusively on color to communicate status.
- Manage focus correctly in dialogs and popovers.
- Respect reduced-motion preferences.
- Verify accessibility with automated and manual tests.

## Performance

- Avoid unnecessary client-side JavaScript.
- Use Server Components when appropriate.
- Avoid unnecessary re-renders.
- Use memoization only when justified.
- Keep dependencies and bundle sizes under control.
- Optimize fonts and assets.
- Prevent layout shifts.
- Measure performance using a production build.
- Never claim performance results that have not been measured.

## Testing

- Unit tests for domain logic.
- Integration tests for interacting features.
- End-to-end tests for critical user flows.
- Accessibility tests.
- Visual regression tests.
- Security-related input validation tests.
- Edge-case and empty-state tests.
- Prioritize meaningful assertions over artificial coverage targets.

## Git and CI/CD

- Use Conventional Commits.
- Keep commits small and focused.
- Commit the package lockfile.
- Never commit credentials or private reference materials.
- Run lint, type checking, tests and production build before final delivery.
- Configure GitHub Actions for automated quality checks.

## Agent workflow

1. Read the official challenge.
2. Extract acceptance criteria.
3. Identify ambiguities and risks.
4. Produce an implementation plan.
5. Implement one feature at a time.
6. Test the implementation.
7. Request independent review.
8. Fix verified issues.
9. Update project documentation.

Agents must not modify unrelated files or overwrite another agent's work.

## Definition of Done

A feature is complete only when:

- Acceptance criteria are satisfied.
- Implementation is visually accurate.
- TypeScript validation passes.
- Lint validation passes.
- Relevant tests pass.
- Accessibility has been considered.
- Security implications have been reviewed.
- No unnecessary complexity has been introduced.
- Documentation reflects the actual implementation.

Never report a check as passed without executing it.

Do not hide errors, skip failing tests, fabricate results or weaken quality checks to achieve a successful build.