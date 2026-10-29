# Review standards

- Keep the three public seams separate: pricing has no I/O, catalog reads files, CLI handles arguments/output.
- Use Node built-ins only. No dependency or framework installation.
- User/data errors produce the documented result; do not print credentials, full environment dumps or stack traces to users.
- Documented acceptance behavior takes priority over aesthetic preferences. Optional smell suggestions are nonblocking.
