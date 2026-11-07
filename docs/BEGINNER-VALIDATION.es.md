# Primer laboratorio de presupuestos: Windows y un host Ubuntu

> Traducción de [BEGINNER-VALIDATION.md](BEGINNER-VALIDATION.md). **La versión en inglés es la de referencia**: si las dos no coinciden, sigue la inglesa. Los comandos y los textos para pegar en el chat del agente se dejan en inglés, igual que en la versión de referencia.

Sigue esta página en orden en tu primera ejecución. Usarás Herdr en Ubuntu, accediendo desde Windows, para dirigir Claude Code y Pi en Ubuntu. El host de ejemplo es `sen03`, el usuario de Ubuntu es `netname` y todos los archivos del proyecto están en Ubuntu. Si tus datos son otros, sustituye el destino SSH y el directorio personal. Los comandos marcados **Windows** son de PowerShell; los marcados **Ubuntu** se ejecutan después de conectar por SSH. El texto marcado **chat del coordinador** se pega en la conversación del agente dentro de un panel de Herdr, nunca en una línea de comandos.

El objetivo es un programa de presupuestos muy pequeño: un catálogo tiene un PEN a 1250 céntimos; si pides tres, imprime un presupuesto de 3750 céntimos. Primero revisarás el diseño propuesto y después verás cómo se ejecutan dos tareas independientes antes de que una tercera las combine. Las llamadas a modelos usan tus suscripciones o cuentas de API y pueden tener coste.

Esta página cubre una ejecución supervisada con éxito. La [guía de validación completa](PR-VALIDATION.md) contiene ejercicios adicionales de fallo y recuperación; hazlos después antes de dar por validado el framework. Tu primera ejecución no es evidencia de comprobaciones que no has hecho.

## Distingue estas cuatro cosas

| Nombre | Qué significa en este recorrido |
| --- | --- |
| Host | `sen03`, el ordenador Ubuntu donde corren el servidor de Herdr y los agentes |
| Checkout de skills | `/home/netname/code/pi-skills-validation-01`, las instrucciones y helpers que usan los agentes |
| Proyecto de laboratorio | `/home/netname/code/quote-workflow-lab-01`, la aplicación aparte que van a construir |
| Fila de rol | Una entrada de `docs/agents/delegation.json` del laboratorio: harness, modo, modelo exacto, familia y herramientas de un tipo de sesión (se muestra como tabla en `delegation.md`) |

Claude Code y Pi son herramientas de agente que llaman a modelos. Herdr ejecuta sus sesiones en paneles que siguen vivos cuando te desconectas. Una fila de rol no es una sesión en marcha. La persona acepta el diseño; la sesión coordinadora gestiona tickets y workers. A/B/C son nombres de tareas, no de modelos. Los commits de Git identifican versiones guardadas exactas; ese identificador largo se llama SHA.

Si alguien ya preparó el host o el laboratorio, verifica ese trabajo en los pasos 1–4 y continúa en el primer punto incompleto. No clones encima de un checkout existente ni regeneres un laboratorio existente. Cuando exista, guarda una nota breve con tu paso actual, rutas e IDs de ejecución en el directorio ignorado `.scratch/quote-demo/` del laboratorio.

| Pasos | Al terminar deberías tener |
| --- | --- |
| 1–4: host y laboratorio | SSH y herramientas funcionando, la revisión del paquete anotada y un laboratorio |
| 5–7: Herdr y sesiones | Una sesión de Herdr, ejecuciones de diagnóstico reales y la configuración del laboratorio commiteada con las filas de rol rellenas |
| 8–9: diseño | Vista previa y diagramas de secuencia comprensibles, informes independientes y tu decisión real |
| 10–11: implementación | Código integrado y verificado, revisiones y una demostración manual |
| 12: valoración | Evidencias conservadas; comprobaciones hechas y no hechas bien separadas |

Algunos fallos son normales al principio y pasan a ser fallos reales más adelante. Usa esta tabla para distinguirlos:

| Lo que ves | En los pasos 1–9 (antes de implementar) | En los pasos 10–12 (implementación y entrega) |
| --- | --- | --- |
| Faltan los módulos `src/` de la aplicación, o fallan sus tests de aceptación | **Normal.** El laboratorio trae tests pero no código de la aplicación. Anota en qué paso estás; nunca modifiques los tests para que pasen. | **Un fallo real.** Hay que reparar la implementación o sus comprobaciones. |
| Falla la comprobación de preparación del diseño (el helper design-check del paso 9) | **Normal** hasta que se registren las revisiones independientes del diseño y tu aceptación. | **No se admite.** Debe pasar antes de que el coordinador lance cualquier worker de los tickets afectados. |
| Fallan los tests del paquete de skills (`npm test`), un harness no puede iniciar sesión con su proveedor, o una vista de diagrama necesaria no se renderiza | **Bloqueo.** Detente y corrígelo antes de continuar. | **Sigue siendo un bloqueo.** Nunca lo des por superado. |

## 1. Conéctate a Ubuntu y comprueba las herramientas

**Dónde / quién:** PowerShell en Windows, tú.

```powershell
ssh sen03
```

**Resultado esperado:** una shell de Ubuntu con tu usuario de desarrollo. Ejecuta:

```bash
hostname
whoami
pwd
export PATH="$HOME/.local/bin:$HOME/.pi/agent/bin:$PATH"
git --version
node --version
npm --version
pi --version
claude --version
herdr --version
```

**Resultado esperado:** el host y usuario correctos y una versión por herramienta. La referencia del recorrido es Node 24 LTS. La línea de PATH afecta a esta shell y cubre las dos ubicaciones habituales de Pi; no cambia un servidor de Herdr que ya esté en marcha.

**Si no coincide:** un timeout significa que primero hay que arreglar el acceso SSH o la red. `command not found` significa que hay que localizar o instalar esa herramienta antes de seguir. Una máquina que empieza de cero debe completar las [instrucciones de instalación del host](MANUAL.md#prepare-the-execution-host) del manual y volver aquí. Lo que ya está instalado no hay que reinstalarlo. Deja abierta esta terminal SSH para los comandos de Ubuntu siguientes; una terminal nueva necesita otra vez el PATH y las variables.

## 2. Comprueba Herdr y los dos harnesses

**Dónde / quién:** terminal de Ubuntu, tú.

```bash
herdr integration status
pi --list-models deepseek
claude -p "Reply with OK."
```

**Resultado esperado:** la lista de integraciones incluye `pi` y `claude`; Pi lista el modelo de DeepSeek que vas a usar; Claude imprime una respuesta. Que un modelo aparezca en `--list-models` indica que existe, no que tu cuenta pueda usarlo; el paso 6 comprueba sesiones reales.

**Si no coincide:** instala las integraciones que falten (permiten que las sesiones informen de su estado y se reanuden tras reiniciar el servidor de Herdr):

```bash
herdr integration install pi
```

```bash
herdr integration install claude
```

Si Claude imprime "Not logged in", ejecuta `claude` una vez en Ubuntu y sigue su proceso de inicio de sesión; para Pi, configura el proveedor en `pi` y selecciónalo con `/model`. No pongas secretos en chats ni en archivos de evidencias. No sigas hasta que funcionen los dos harnesses.

## 3. Obtén y verifica el checkout de skills

**Dónde / quién:** terminal de Ubuntu, tú.

```bash
export MP_SKILLS="$HOME/code/pi-skills-validation-01"
export MP_LAB="$HOME/code/quote-workflow-lab-01"
printf 'Skills: %s\nLab: %s\n' "$MP_SKILLS" "$MP_LAB"
```

Si el directorio de skills no existe, ejecuta este bloque una vez:

```bash
mkdir -p "$HOME/code" &&
git clone --branch main --single-branch \
  https://github.com/netname/pi-adapted-mp-skills.git "$MP_SKILLS"
```

Tanto si el checkout es nuevo como si ya existía, ejecuta:

```bash
git -C "$MP_SKILLS" branch --show-current
git -C "$MP_SKILLS" status --short
git -C "$MP_SKILLS" rev-parse HEAD
cd "$MP_SKILLS" && npm ci && npm test
```

**Resultado esperado:** rama `main` (o la rama del PR que hayas elegido validar), sin cambios sin commitear en el paquete, y todos los tests del paquete pasan. Anota en tus notas el SHA real de los skills y las versiones de las herramientas. El número de tests puede cambiar. Estos tests comprueban el paquete de skills; la aplicación de presupuestos todavía no existe.

**Si no coincide:** para si la rama es otra, si el checkout tiene cambios o si fallan los tests. Conserva las ediciones locales y pide ayuda para reconciliar el checkout; no lo resetees. Si actualizas el paquete a propósito, termina antes de anotar el SHA de la ejecución. Mantén esa revisión fija durante esta ejecución. Estas instrucciones evalúan una rama sin fusionar, no la rama por defecto ni una versión publicada en npm.

## 4. Crea o reutiliza el laboratorio

**Dónde / quién:** terminal de Ubuntu, tú.

Solo para un directorio de laboratorio **nuevo**:

```bash
node "$MP_SKILLS/examples/validation-lab/create.mjs" "$MP_LAB" &&
git -C "$MP_LAB" init -b main &&
cd "$MP_LAB" && pi install -l "$MP_SKILLS"
```

Para un laboratorio **existente**, sáltate ese bloque y verifica en su lugar el registro del paquete:

```bash
cd "$MP_LAB" && pi list --approve
cat "$MP_LAB/AGENTS.md"
cat "$MP_LAB/docs/agents/architecture.md"
```

**Resultado esperado:** Pi lista el checkout de skills previsto entre los paquetes del proyecto. `AGENTS.md` identifica este laboratorio y una única ruta canónica del tracker, normalmente `$MP_LAB/.scratch/quote-demo`. Existen la spec, el diseño, el modelo y los tests. El andamiaje nuevo no tiene implementación en `src/`; es intencionado. Si un laboratorio anterior ya contiene implementación o evidencias, consérvalas y reanuda la fase anotada. Una ejecución nueva con un fixture cambiado usa un laboratorio con número nuevo, ajustando las rutas en toda esta página.

La instalación con alcance de proyecto mantiene esta rama sin fusionar fuera de tus otros proyectos y sirve a las sesiones que se abren en el propio directorio del laboratorio. Los workers corren en worktrees de Herdr bajo `~/.herdr/worktrees/`, donde esa instalación no se resuelve; por eso el coordinador les pasa los archivos de skills por ruta absoluta, como hacen los prompts de abajo.

En un laboratorio nuevo, copia una vez estas plantillas de informe antes de anotar resultados, y crea el directorio de evidencias para los registros de ejecución:

```bash
cp -n "$MP_SKILLS/docs/VALIDATION-REPORT.md" \
  "$MP_LAB/.scratch/quote-demo/validation-report.md"
cp -n "$MP_SKILLS/docs/ARCHITECTURE-VALIDATION.md" \
  "$MP_LAB/.scratch/quote-demo/architecture-validation.md"
mkdir -p "$MP_LAB/.scratch/quote-demo/runs"
```

**Si no coincide:** `destination exists` del generador es una protección, no un laboratorio fallido que haya que borrar. Revisa qué se creó y reanuda el paso que falte. Si un paquete ya estaba registrado, verifica su ruta y evita duplicarlo. No sobrescribas copias de informe ya completadas; Git ignora `.scratch`, así que hay que conservarlo aparte. Otros nombres de informe en una ejecución existente están bien: mantén sus ubicaciones y referencias.

## 5. Arranca la sesión de Herdr y elige las filas de rol

**Dónde / quién:** terminal de Ubuntu (o Windows con `herdr --remote`), tú.

Arranca una sesión de Herdr con nombre para el laboratorio. O bien en tu terminal SSH:

```bash
herdr --session quote-lab
```

o bien, desde **Windows**, deja que el servidor de Ubuntu sea dueño de los paneles mientras tu terminal solo los dibuja (esta vía sigue la documentación de Herdr y no se ha probado con este paquete; si da problemas, usa la vía SSH):

```powershell
herdr --remote netname@sen03 --session quote-lab
```

Abre un panel en el directorio del laboratorio (`cd "$MP_LAB"` dentro de él). En esta sesión de Herdr vivirán el coordinador y todas las sesiones delegadas.

**Salir y volver.** Pulsa `Ctrl+B q` para desconectarte: tu terminal vuelve al prompt normal del shell, mientras el servidor de Herdr en Ubuntu mantiene en marcha la sesión y todos sus paneles. Cerrar el terminal o perder la conexión SSH tiene el mismo efecto. Para volver, ejecuta el mismo comando con el que la iniciaste y el mismo nombre de sesión. Si la iniciaste desde el terminal SSH y sigue abierto, ejecuta ahí:

```bash
herdr --session quote-lab
```

Si se cerró la conexión SSH, vuelve a conectarte primero desde **Windows** con `ssh sen03` y después ejecuta en Ubuntu el mismo `herdr --session quote-lab`. Si usaste la vía de Windows, vuelve a ejecutar su comando desde PowerShell:

```powershell
herdr --remote netname@sen03 --session quote-lab
```

**Esperado:** reaparecen los mismos paneles, con los agentes todavía en marcha o ya terminados. No se reinician. Con otro nombre de sesión se abre una sesión nueva y vacía, así que mantén el nombre `quote-lab`.

Estas son las filas de rol de este laboratorio. Una fila de rol es una receta guardada para un tipo de sesión de agente: qué programa ejecutar, en qué modo, con qué modelo y con qué permisos. Escribir una fila no arranca nada. Al final de este paso escribes las filas en el `docs/agents/delegation.json` del laboratorio. A partir de ahí, cada vez que el coordinador necesita una sesión para ese rol, la lanza con `--config docs/agents/delegation.json --role <rol>`, y el helper toma todo lo demás de la fila. Tú eliges las filas; no escribes los comandos de lanzamiento.

| Fila de rol | Quién la arranca y cuándo | Harness / familia de modelo | Modo | Modelo | Herramientas |
| --- | --- | --- | --- | --- | --- |
| `planning` | Tú, ejecutando `claude` en un panel de Herdr (pasos 6, 7 y 10). El helper nunca la lanza. | Claude Code / Claude | la propia sesión del coordinador | tu modelo de Claude | — |
| `implementation` | El coordinador en el paso 10: un worker por ticket (A, B y después C), cada uno en su propio worktree | Pi / DeepSeek | interactive | `deepseek/deepseek-flash` | completas |
| `design-comprehension`, `design-challenge` | El coordinador en el paso 9: dos revisiones separadas del diseño (el diagnóstico del paso 6 usa la primera) | Pi / DeepSeek | batch | `deepseek/deepseek-flash` | solo lectura |
| `spec-review`, `standards-review` | El coordinador en el paso 10: dos revisiones separadas del código de cada ticket (el segundo diagnóstico del paso 6 usa la primera) | Claude Code / Claude | batch | `anthropic/claude-sonnet-5-5` | solo lectura |

Qué significa cada columna:

- **Harness** es el programa de agente que ejecuta la sesión: `pi` o `claude`. La **familia de modelo** es la familia del proveedor que hay detrás del modelo. Los revisores deben usar una familia distinta de la de los autores que revisan: DeepSeek revisa el diseño de Claude y Claude revisa el código de DeepSeek. `config check` rechaza las filas que incumplen esta regla.
- **Modo** indica cómo se ejecuta la sesión. Una sesión **interactive** permanece abierta en un panel de Herdr. Edita archivos en su propio worktree, y puedes conectarte para observarla. Una sesión **batch** se ejecuta una sola vez sin ninguna persona (`pi -p` o `claude -p`). El helper guarda su respuesta final en un archivo de informe, y después la sesión termina. Las revisiones son batch, así que su informe nunca depende de lo que se viera en pantalla.
- **Modelo** se escribe como `proveedor/id`, la forma en que el helper informa del modelo que respondió de verdad. Para Claude Code es `anthropic/<id>`.
- **Herramientas** indica lo que la sesión puede hacer. **Solo lectura** limita a un revisor a leer archivos, de modo que no puede editar, ejecutar tests ni acceder a la red. El helper lo traduce a las opciones de cada harness: `--tools read,grep,find,ls` para Pi y `--tools Read,Grep,Glob --permission-mode dontAsk` para Claude Code. `dontAsk` hace que Claude Code rechace cualquier acción no permitida en vez de esperar una aprobación que nadie va a dar. La implementación tiene todas las herramientas porque los workers tienen que editar y ejecutar tests.

Por ejemplo, una revisión de Spec del ticket A se convierte en un lanzamiento como este (el coordinador elige los nombres y las rutas):

```bash
node "$MP_SKILLS/scripts/herdr-delegate.mjs" launch \
  --config "$MP_LAB/docs/agents/delegation.json" --role spec-review --name spec-a1 \
  --brief "$MP_SKILLS/agents/mp-review-spec.md" \
  --task "$MP_LAB/.scratch/quote-demo/runs/spec-a1.task.md" \
  --record "$MP_LAB/.scratch/quote-demo/runs/spec-a1.json" \
  --output "$MP_LAB/.scratch/quote-demo/runs/spec-a1.report.md" \
  --cwd /ruta/al/worktree/del/ticket-a
```

Las opciones describen la propia ejecución: el rol, un nombre de ejecución, el brief, la tarea y la ubicación de los archivos. El helper añade el harness, el modo y los argumentos de la fila (`--model claude-sonnet-5-5 --tools Read,Grep,Glob --permission-mode dontAsk`), y rechaza un lanzamiento que intente cambiarlos. También permite a Claude Code leer el brief y la tarea aunque estén fuera del worktree. El registro de la ejecución (`spec-a1.json`) guarda los argumentos como `harnessArgs`, junto con la ruta y el hash de la configuración. Al ejecutar `herdr-delegate.mjs inspect` sobre el registro se comprueba que el modelo que respondió de verdad coincide con la fila. La evidencia es ese modelo, no la fila.

Los IDs de modelo son ejemplos que `sen03` ofrecía durante la preparación. Úsalos solo si `pi --list-models` y tu cuenta de Claude los ofrecen; si no, elige un modelo disponible de la misma familia y anota su ID exacto. No son promesas de acceso ni de mejor rendimiento.

**Escribe las filas.** En un panel del laboratorio (Ubuntu), cambia el modelo de planificación por el que uses y ejecuta:

```bash
node "$MP_SKILLS/scripts/mp-setup.mjs" init "$MP_LAB" --session quote-lab \
  --evidence "$MP_LAB/.scratch/quote-demo/runs" --setup "npm ci" \
  --role planning=claude:anthropic/claude-opus-5-5:Claude \
  --role implementation=pi:deepseek/deepseek-flash:DeepSeek \
  --role design-comprehension=pi:deepseek/deepseek-flash:DeepSeek \
  --role design-challenge=pi:deepseek/deepseek-flash:DeepSeek \
  --role spec-review=claude:anthropic/claude-sonnet-5-5:Claude \
  --role standards-review=claude:anthropic/claude-sonnet-5-5:Claude \
  --unavailable "research=not exercised in the first run"
```

Cada `--role` es `ROL=HARNESS:MODELO:FAMILIA`; el modo y las herramientas salen del rol. El comando escribe `docs/agents/delegation.json`, genera las mismas filas como tabla en `docs/agents/delegation.md`, crea el directorio de evidencias, comprueba las filas y busca nombres de skill duplicados. Nunca sobrescribe un archivo que hayas editado: en un laboratorio existente cuyo `delegation.json` ya tenga tus filas, sáltatelo y ejecuta `config check`. Después comprueba que este host puede ejecutar todas las filas:

```bash
node "$MP_SKILLS/scripts/herdr-delegate.mjs" config probe "$MP_LAB/docs/agents/delegation.json" --live
```

`--live` envía un prompt corto a cada modelo, lo que puede tener coste. Sin él solo se comprueban el servidor de Herdr, las integraciones, los dos CLI y la lista de modelos de Pi.

**Resultado esperado:** una sesión de Herdr en marcha con un panel en el laboratorio; `init` informa `"ok": true` con `config.table` en `in-sync`; el probe informa `"ok": true`, y con `--live` cada línea de modelo dice `answered by` con el mismo modelo que su fila. La planificación con Claude tiene revisión de diseño independiente con DeepSeek; la implementación con DeepSeek tiene revisión de código independiente con Claude. Cada eje de revisión usa una sesión nueva aparte, aunque se reutilice una fila.

**Si no coincide:** si `herdr --remote` no conecta, comprueba que `ssh netname@sen03` funciona y que Herdr está instalado en Ubuntu. Una línea fallida del probe nombra el problema. Por ejemplo, `401 … invalid` significa que el proveedor rechazó tu clave de API; corrígela en ese harness y reinicia los paneles que lo usan. Los errores de `init` nombran el rol y el ajuste que hay que corregir. Para antes de una revisión real si no se puede verificar la independencia.

## 6. Comprueba cada harness y un hijo delegado

**Dónde / quién:** el panel de Herdr en el laboratorio; tú arrancas un coordinador de diagnóstico y los agentes solo hacen las comprobaciones que se piden aquí.

En el panel del laboratorio ejecuta `claude` y pega:

```text
This is a setup check. Report your working directory, read AGENTS.md and
docs/architecture/overview.md, and summarize the proposed quotation app.
Do not edit files, run tests, create commits or launch other agents.
Report missing files honestly. Do not treat supplied drafts as accepted.
```

Abre un segundo panel en el laboratorio, ejecuta `pi --model deepseek/deepseek-flash` y envía el mismo prompt. Una sesión abierta en una terminal cualquiera fuera de Herdr no la gestiona Herdr.

**Resultado esperado:** las dos responden sobre el laboratorio. Su pie de pantalla o `/session` muestran el modelo, pero esa no es todavía la evidencia que necesita el flujo; lo es la comprobación delegada de abajo. Un modelo que aparece en `--list-models` puede fallar igualmente por inicio de sesión, cuota o endpoint; resuélvelo antes de seguir.

En la sesión de Claude pega:

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/_shared/DELEGATION.md.
Launch exactly one fresh session with
node /home/netname/code/pi-skills-validation-01/scripts/herdr-delegate.mjs launch
--config /home/netname/code/quote-workflow-lab-01/docs/agents/delegation.json
--role design-comprehension, the brief
/home/netname/code/pi-skills-validation-01/agents/mp-review-design.md,
--cwd /home/netname/code/quote-workflow-lab-01, and a task, record and --output
you create under .scratch/quote-demo/runs/. Do not add --harness, --mode or
arguments after --. The task says this is a transport check, not a review; its
only work: read AGENTS.md and docs/architecture/overview.md and summarize the
proposed app in three sentences. Wait until the record's status is completed or
failed, then run herdr-delegate.mjs inspect <record>. Report the run ID, the
modelCheck result, the effective model and the summary from --output.
Do not replace a run whose state is unknown.
```

Después envía la misma petición con `--role spec-review` y el brief `agents/mp-review-spec.md`, para comprobar también en tu host la fila de revisión de Claude Code.

**Resultado esperado:** cada registro muestra `completed`, `inspect` termina con un `modelCheck` cuyo `result` es `match`, y el coordinador devuelve el resumen real del hijo. Puedes ver el panel del hijo con `herdr agent list` / `herdr workspace list`. Al terminar cierra las sesiones de diagnóstico; en el paso 7 usa una sesión de planificación nueva. **Si no coincide:** anota la comprobación previa como fallida o incompleta. El `failureDetail` de un registro fallido da el error del proveedor cuando lo hubo. Si el informe dice que la sesión no pudo leer su brief, el checkout de skills es anterior al arreglo de acceso de lectura; actualízalo. Un registro sin modelo efectivo bloquea la puerta de revisión. Nunca sustituyas un hijo en estado desconocido ni sigas suponiendo que todo fue bien.

## 7. Deja que una sesión de planificación termine la configuración

**Dónde / quién:** una sesión nueva de `claude` en el panel del laboratorio; el agente prepara los cambios y tú los revisas. Las rutas del prompt son las de los directorios de ejemplo; cámbialas si las tuyas son otras.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/setup-matt-pocock-skills/SKILL.md
and apply it to /home/netname/code/quote-workflow-lab-01, resolving references
from the skill directory. Delegation is already written and probed in
docs/agents/delegation.json; do not change it. Reuse the Herdr session quote-lab.
Preserve the supplied spec/tests/scope and canonical tracker in AGENTS.md.
Record the step 6 run evidence and missing capabilities in the lab reports.
No implementation, worker dispatch or human design acceptance yet.
Explain changes and remaining questions in plain language for my inspection.
```

Las filas de rol, la ruta del helper, el directorio de evidencias y las comprobaciones del host ya están hechas, así que el prompt solo nombra lo que falta: el tracker, los contratos de testing y de arquitectura, y los informes. La skill ejecuta `mp-setup.mjs init` por su cuenta; conserva tu `delegation.json` e informa de lo que aún falta.

**Resultado esperado:** el agente rellena la configuración que falta y explica lo que quede pendiente. Deberías entender quién planifica, quién construye y quién revisa. La investigación sigue no disponible en esta primera ejecución y no se lanza.

**Dónde / quién:** terminal de Ubuntu; tú revisas y guardas la configuración:

```bash
cd "$MP_LAB" && git status --short && git diff
cat docs/agents/delegation.json docs/agents/delegation.md
node "$MP_SKILLS/scripts/herdr-delegate.mjs" config check "$MP_LAB/docs/agents/delegation.json"
cat docs/agents/testing.md
cat docs/agents/architecture.md
```

Abre por separado cualquier archivo nuevo que aparezca como `??`; `git diff` no muestra el contenido de los archivos sin seguimiento. Cuando la configuración sea la prevista, haz commit y anota el SHA como **línea base inicial del laboratorio**:

```bash
git add AGENTS.md CODING_STANDARDS.md GLOSSARY.md .gitignore .pi/settings.json docs package.json test &&
git commit -m "Configure quotation lab validation" && git rev-parse HEAD
```

Si la configuración ya estaba commiteada y no hay cambios previstos, anota `git rev-parse HEAD`. Nunca hagas un commit vacío para cumplir un paso. Las evidencias de `.scratch` no entran: consérvalas aparte. **Si no coincide:** pide que te expliquen los cambios que no entiendas antes de hacer commit. En este paso no debe crearse código de la aplicación.

## 8. Revisa el diseño y los diagramas de secuencia renderizados

**Dónde / quién:** el mismo chat de planificación; el agente prepara una explicación y tú la revisas.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/design-solution/SKILL.md
and follow it for /home/netname/code/quote-workflow-lab-01.
Explain the supplied spec and proposed changes C1-C3, expected code areas,
ownership, output examples and alternatives in plain language. Preserve R1-R4,
tests and exclusions. Keep current/proposed/unknown claims distinct.
Prepare readable component and success/failure sequence views from the shared
model. Point me to rendered views I can actually open. Identify unresolved
choices; do not implement or accept the design for me.
```

Para una vista previa desde la terminal de Ubuntu, ejecuta (en otro panel de Herdr, para que el chat de planificación quede libre):

```bash
cd "$MP_LAB/docs/architecture/model" &&
npx --yes --package=likec4@1.60.0 likec4 validate &&
npx --yes --package=likec4@1.60.0 likec4 start
```

**Resultado esperado:** la validación pasa y se imprime una URL de vista previa. El `localhost` de esa URL es Ubuntu. Para verla desde Windows, abre otra terminal de PowerShell y redirige el puerto indicado, por ejemplo `ssh -N -L 5173:127.0.0.1:5173 sen03` si la vista previa usa el 5173. Después abre `http://localhost:5173` en el navegador de Windows. Usa el puerto real; si está ocupado, elige otro puerto local y ajusta la URL. Deja abierta la terminal de redirección mientras miras; Ctrl+C la cierra. Para la vista previa con Ctrl+C al terminar.

Revisa `components`, `quoteSuccess` y `quoteFailure` junto a la tabla C1-C3 del diseño. ¿Sabrías explicar qué componente lee, cuál calcula, cuál imprime y por qué un JSON mal formado no produce presupuesto? El agente anota los IDs de las vistas, la instantánea de las fuentes, los comandos y la evidencia de presentación. Si el navegador no llega a la vista previa, arregla el túnel o el puerto antes de dar la presentación por completa. Que el modelo se valide no equivale a haber revisado las vistas.

## 9. Consigue la revisión independiente y toma tu decisión

**Dónde / quién:** chat de planificación; el coordinador organiza la revisión y tú decides si aceptas.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/review-design/SKILL.md
and apply it to /home/netname/code/quote-workflow-lab-01.
Freeze the current spec/design/model/ADR/coverage and quote-plan.md inputs.
Launch separate fresh comprehension and challenge sessions through Herdr with
--config docs/agents/delegation.json and the design-review roles, independent of
every design author, and verify each run with inspect. Collect the real reports with
run/model/input identities. Resolve blockers and preserve findings.
Check supplied tickets A/B/C and their coverage; do not create duplicate tickets.
Present what changes, success/failure behavior, alternatives, remaining decisions
and rendered views. Prepare readiness records from actual evidence, leaving
human acceptance pending. Do not start implementation.
```

**Resultado esperado:** dos informes reales, hallazgos y resoluciones visibles, cobertura de R1–R4 y una propuesta comprensible. El coordinador prepara las huellas y los registros JSON; no tienes que calcularlos ni editarlos a mano. Pregunta o pide cambios si algún comportamiento no está claro. Revisa de nuevo los cambios afectados antes de aceptar.

Solo si refleja tu decisión, escribe en ese chat:

```text
I accept the current reviewed quotation design and A/B/C plan for this
disposable lab, preserving R1-R4 and the supplied exclusions. Record a durable
reference to this actual decision against the exact inputs I reviewed.
```

Después envía:

```text
Complete the readiness record using the actual reports and my decision.
Run the design-check helper; report the actual outcome. If it passes, commit
the intended planning records and give me the approved execution baseline SHA,
canonical tracker root and evidence locations. Do not implement yet.
```

**Resultado esperado:** `ready: true` y un **SHA de línea base de ejecución** commiteado. Puede ser distinto de la línea base inicial del andamiaje. Que un agente escriba la palabra `accepted` no basta. **Si no coincide:** es normal que la comprobación del borrador falle antes de las revisiones y la aceptación reales; después debe pasar antes de lanzar nada. Si faltan informes, hay hashes obsoletos o bloqueos sin resolver, hay que resolverlos, no fabricar registros. El helper comprueba la integridad del registro, no el consentimiento ni la calidad del diseño.

## 10. Arranca un coordinador y revisa sus dos workers

**Dónde / quién:** una sesión **nueva** de `claude` en un panel de Herdr en el laboratorio; tú aportas la línea base de ejecución aceptada. Antes de enviar, sustituye `EXECUTION_SHA` por el SHA real del paso 9.

```text
Read /home/netname/code/pi-skills-validation-01/skills/engineering/implement-spec/SKILL.md
and follow it for /home/netname/code/quote-workflow-lab-01.
Use the actual accepted design/plan/readiness and project contracts. Use the
original canonical tracker root from AGENTS.md; verify evidence before dispatch.
Create a dedicated integration worktree from EXECUTION_SHA. You are the single
coordinator and tracker/integration writer. Maximum two implementation workers.
Launch workers and reviewers through Herdr with --config docs/agents/delegation.json,
the implementation and code-review roles and explicit role briefs; give workers
the skill files by absolute path. Verify every run with inspect. Do not implement the
application yourself.
Launch A and B in separate worktrees, paused before editing so I can inspect
their run IDs, effective models, paths and starting revisions. Do not launch C
until both prerequisites are integrated and verified. After my release, run the
graph automatically through verification, independent review and serial integration.
Use local delivery only. No remote repository, push, merge main or evidence cleanup.
Pause for genuine blockers, required decisions, exhausted retry budget or final inspection.
```

**Resultado esperado:** el coordinador comprueba la preparación y muestra A y B como sesiones distintas. Cada una tiene su propio worktree, un directorio de checkout aparte que impide que los workers se pisen. En Ubuntu:

```bash
git -C "$MP_LAB" worktree list --porcelain
herdr --session quote-lab agent list
```

Compara las rutas, los modelos efectivos (de la salida de `inspect` de los registros) y las revisiones de partida con el informe del coordinador. C no debe haber arrancado. Puedes observar un worker con `herdr --session quote-lab agent attach <nombre>` (te desconectas con `Ctrl+B q`). Anota lo que has revisado. Si todo es correcto, envía:

```text
The observation checkpoint is complete. Release A and B and continue within
the configured limits through C and final verification. Preserve evidence.
```

**Si no coincide:** deja en pausa los workers afectados y pide al coordinador que explique o corrija la discrepancia. A y B pueden terminar en cualquier orden. El coordinador debería lanzar C sin que se lo pidas otra vez en cuanto pasen las dos integraciones previas. Las comprobaciones finales pueden llevar varios turnos; revisa `herdr agent list` y los registros de ejecución en vez de lanzar un coordinador duplicado.

## 11. Revisa el resultado final

**Dónde / quién:** chat del coordinador; el agente aporta la evidencia y tú valoras el resultado.

```text
Give me the final integration worktree path and SHA, original execution baseline,
ticket states, actual review reports and all-suite verification manifest. Compare
planned versus actual changes C1-C3, including sequence behavior and deviations.
Explain remaining gaps. Preserve proposal history and evidence. Do not merge or clean up.
```

Indica en Ubuntu la ruta real del candidato; no supongas que el checkout original del laboratorio contiene la implementación:

```bash
export MP_CANDIDATE="/paste/the/actual/integration/worktree/path"
node "$MP_SKILLS/examples/validation-lab/verify.mjs" \
  "$MP_CANDIDATE" all "$MP_LAB/.scratch/quote-demo/evidence"
git -C "$MP_CANDIDATE" status --short
```

**Resultado esperado:** la verificación devuelve `passed: true`, el candidato está limpio y las revisiones apuntan a su revisión exacta. Deberías ver que A y B se solaparon y que C esperó a que A+B estuvieran verificados. Para una demostración manual:

```bash
cat > "$MP_LAB/.scratch/quote-demo/catalog.json" <<'JSON'
[{"sku":"PEN","name":"Bolígrafo","unitPriceCents":1250}]
JSON
node "$MP_CANDIDATE/src/cli.mjs" "$MP_LAB/.scratch/quote-demo/catalog.json" PEN 3
```

Salida esperada, seguida de un salto de línea, con código de salida 0 y sin texto de error:

```json
{"sku":"PEN","name":"Bolígrafo","quantity":3,"totalCents":3750}
```

**Si no coincide:** antes de implementar, era esperable que faltaran módulos y fallaran los tests de la aplicación; tras la entrega final son fallos que hay que reparar. Conserva los logs y los IDs de ejecución reales. Un mensaje final tranquilizador en el chat no sustituye a la evidencia ejecutable ni a las revisiones independientes.

## 12. Registra esta ejecución y decide qué validar después

**Dónde / quién:** tú, con ayuda del coordinador para completar las copias de los informes. Anota los SHA reales (skills, inicial, ejecución, final), las versiones de las herramientas, los modelos, los IDs de ejecución, los resultados observados y las limitaciones. Guarda las evidencias de `.scratch` aparte del historial de Git. Si te interrumpen, desconéctate de Herdr en lugar de cerrar sesiones; anota tu paso y los IDs de ejecución, y pide al coordinador que reconcilie los registros de ejecución y los claims existentes antes de reanudar, en vez de crear sesiones de reemplazo.

Una primera ejecución con éxito demuestra solo lo que observaste. Deja como **NOT RUN** el ensayo de descubrimiento, los fallos provocados, la recuperación tras cancelar o reiniciar y cualquier combinación de proveedor/SO no probada. Cuando estés listo, sigue con los [ejercicios de fallo](PR-VALIDATION.md#6-exercise-failure-paths), el [ejercicio de secuencia sobre código existente](../examples/validation-lab/design-change-exercise/README.md) y la [valoración](PR-VALIDATION.md#7-evaluate-the-framework) de la guía completa. Una recomendación sobre el framework es independiente de aceptar el diseño de este laboratorio o de autorizar una fusión en el repositorio.
