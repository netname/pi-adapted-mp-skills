# Project testing

Populate commands from the repository's existing scripts/CI. Do not leave required checks as placeholders.

| Profile | Exact command(s) | Categories / selection rule | Required environment |
| --- | --- | --- | --- |
| Fast | configure | focused unit/component + static checks | configure |
| Verify change | configure | affected tests + integration; journey smoke if relevant | configure |
| Verify candidate | configure | combined regression, integration/E2E, migrations if relevant | configure |

Approved seams and acceptance behavior: link the spec.
Environment isolation or exclusive lease mechanism: configure.
Setup / seed / cleanup commands: configure.
Resource owner / run ID / cleanup responsibility: configure.
Timeout and retry policy: configure.
Evidence location (outside tracked source): configure.
Required CI checks and merge policy: configure.

A category may be not applicable with a reason. A required unavailable environment blocks the gate. Preserve failures and exit codes; never turn a skip into a pass.
