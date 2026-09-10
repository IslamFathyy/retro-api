/**
 * Demo retrospective seed data — Sprints 1–4.
 * Feedback wording differs per sprint; recurring topics support cross-retro report testing.
 */

export const DEMO_TEAM = 'Chartswap';

export const SPRINT_SEED_DATA = [
  {
    sprint: 1,
    title: 'Sprint 1 Retro',
    period: 'Sprint 1',
    feedback: [
      { type: 'went-well', text: 'Strong team collaboration during release week.' },
      { type: 'went-well', text: 'We delivered the milestone on the planned date.' },
      { type: 'did-not-go-well', text: 'A large number of bugs escaped to QA late in the sprint.' },
      { type: 'did-not-go-well', text: 'Daily sync meetings often ran over the scheduled time.' },
      { type: 'improvement', text: 'Align with QA on test scope before formal testing starts.' },
      { type: 'improvement', text: 'Pull requests should require two reviewers before merge.' },
    ],
  },
  {
    sprint: 2,
    title: 'Sprint 2 Retro',
    period: 'Sprint 2',
    feedback: [
      { type: 'went-well', text: 'The deployment pipeline was stable across all releases.' },
      { type: 'went-well', text: 'Pair programming helped us finish the API migration faster.' },
      { type: 'did-not-go-well', text: 'Code reviews sat idle for days before anyone responded.' },
      { type: 'did-not-go-well', text: 'Two stories entered the sprint without clear acceptance criteria.' },
      { type: 'improvement', text: 'Define a first-response target for pull request reviews.' },
      { type: 'improvement', text: 'Add a readiness checklist before stories enter the sprint.' },
    ],
  },
  {
    sprint: 3,
    title: 'Sprint 3 Retro',
    period: 'Sprint 3',
    feedback: [
      { type: 'went-well', text: 'QA joined refinement and caught missing acceptance criteria early.' },
      { type: 'went-well', text: 'Handoffs between backend and frontend were smoother this sprint.' },
      { type: 'did-not-go-well', text: 'The code review queue grew again mid-sprint.' },
      { type: 'did-not-go-well', text: 'A regression shipped because integration tests missed the scenario.' },
      { type: 'improvement', text: 'Expand integration test coverage for payment flows.' },
      { type: 'improvement', text: 'Automate configuration validation in the deployment pipeline.' },
    ],
  },
  {
    sprint: 4,
    title: 'Sprint 4 Retro',
    period: 'Sprint 4',
    feedback: [
      { type: 'went-well', text: 'Production releases remained reliable with no rollback.' },
      { type: 'went-well', text: 'The team rallied quickly when a customer escalation landed.' },
      { type: 'did-not-go-well', text: 'Review turnaround is still too slow for urgent fixes.' },
      { type: 'did-not-go-well', text: 'Sprint planning sessions routinely exceed ninety minutes.' },
      { type: 'improvement', text: 'Enforce the two-reviewer policy we discussed in earlier retros.' },
      { type: 'improvement', text: 'Time-box planning and replace status updates with async notes.' },
    ],
  },
];

/**
 * Recurring topics (for docs/tests) — same meaning, different sprint wording:
 * - Code review delays: S2, S3, S4 (+ S1/S4 improvements on review policy)
 * - Meeting length: S1, S4
 * - QA / testing gaps: S1, S3
 * - Sprint readiness / acceptance criteria: S2, S3
 * - Deployment reliability (positive): S2, S4
 */
