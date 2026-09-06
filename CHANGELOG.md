# **Changelog**

All notable changes to Skales will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v12.9.26 - Grip

### Added

- **A paired device can now have this computer turn a recording into text.** A
  phone transcribes on the phone, but a small paired device with a microphone
  and no room for a speech model previously had to reach this machine at its
  address on the local network - so it only worked at home. It now asks over the
  same connection everything else uses, gets the transcript back, and the
  recording never leaves that path. It runs through the same speech setup the
  microphone in Skales uses, so whichever provider you configured is the one
  that answers, and a recording that is too large to travel is refused with a
  reason instead of dropping the connection.
- **The Studio render button now asks before it exports, and the export can go
  through the server.** Pressing Render opens a card in the panel itself: how
  many scenes, which aspect and size, how long, and what should happen to the
  subtitles - nothing is written before that card is answered. Scenes you have
  previewed or edited are still rendered from exactly what you saw; a
  storyboard nobody has previewed goes to the render pipeline in one request,
  which keeps running when you leave the page and is the same path the chat
  tools take. Whatever produced the file, it ends up in the same place: the
  download button, the gallery entry, the subtitle file, and the toast.
- **Campaign, as a Flow template.** One brief, several finished pieces: a hook,
  a main clip and a call to action by default, each its own file named by its
  role, with one palette, one type pairing and the same closing frame across
  all of them, plus a small index page to review the set in one place. It rides
  the motion mode and the existing template picker - no new mode to learn.
- **Skales asks before it exports a video - in every mode.** A render writes a
  finished file and takes minutes of the machine, so the card comes up every
  time and names what is about to come out: how many scenes, which aspect and
  size, how long, and what happens to the subtitles. Auto and Unrestricted do
  not lift it, and the card deliberately offers no "always allow this" button -
  the next film is a new question. A preview frame still runs without asking:
  it writes nothing anyone keeps.
- **A rendered Studio video can carry its subtitles - as a file, burned in, or
  both.** The captions come from the storyboard's own scene text and timing, so
  nothing is transcribed and nothing is guessed: a scene without text still
  holds its place on the clock, so no later line arrives early. The `.srt` is
  written next to the MP4 and stays editable; burned in, the words survive an
  upload to a network that throws sidecar files away. Off is still the default,
  because burned-in pixels cannot be taken back out.
- **Skales Code can see what is in its context, and shorten it.** The figure in
  the status bar now opens a breakdown of the turn: what the system prompt
  takes, what the tool definitions take and how many there are, what the
  conversation itself takes, how much of that is the newest tool results, the
  total against the model's own window, and what the session has cost so far.
  Every number is the one measured on the payload as it went out, so the meter,
  the breakdown and the hint cannot disagree about the same session. The meter
  itself now counts the whole turn rather than only the transcript, which is
  why it reads higher than before and why it now reads true.
- **A shortened stretch of a coding session reads as a lid, not as a wall.**
  `/compact` folds the older half of a conversation away and leaves one card in
  its place saying how many turns went under it; opening the card shows the
  summary. It survives a reload, because the session file carries it.
- **The run line offers to shorten when the window fills up.** Past four fifths
  of the model's context the line adds how full it is and that `/compact`
  shortens it. A suggestion only: nothing is ever folded away without being
  asked, because the conversation belongs to the person having it.
- **An MCP server behind its own certificate authority is reachable.** A server
  on a company network or a self-signed one takes a `CA certificate` in its
  settings - the path to a .pem or .crt file, or the certificate pasted in - and
  that certificate applies to that server's requests and to nothing else on the
  machine. Verification is never switched off, and nothing else Skales talks to
  starts trusting the new root. A certificate that cannot be read says which of
  the three things is wrong - the path, the format or the date - when it is
  saved rather than on the next failed connection, and a connection that fails
  anyway now names the real reason instead of "fetch failed".

- **Skales Code says what it is doing, step by step.** A coding run used to
  show one word - usually "deciding" - for as long as it took, which looks the
  same as a run that died. There is now one live line under the turn: which
  step is on, which tool on which file, and for how long. Parked on a question
  it says so; gone quiet longer than it should, it names what is hanging
  instead of counting up under a word that is no longer true. When the run
  stops, the same line becomes its receipt - steps, files, how long, and what
  the turn cost - read from the session itself, so reopening the window later
  shows the same one.
- **A diff is no longer painted like a failure.** Removed lines and the minus
  counters beside them come from the diff palette rather than from the red this
  window keeps for a step that actually failed, everywhere they appear: on a
  tool line, on a card head, in the status bar and in the session list. Failed
  steps and script errors stay red, because those are errors. A long diff still
  arrives folded, but never blind: its first three changed lines stay on screen
  and the lid says how many are still behind it.
- **Every step says how it ended, as a shape.** Tool steps carry the same tick,
  cross or warning sign the live line uses, in the same slot and at the same
  size, and the rows keep one height as their details fill in.
- **A permission question says how far a yes reaches.** Each button on the card
  now carries one sentence of its own: this call only; every action of that
  kind until this session ends; or every one of them, in every session, until
  you take it back in Settings. An unattended session that stops to ask anyway
  says why, in the words of the check that stopped it.

- **Devices: your other computers, under a name you can read.** The surface
  that used to be called Agent Swarm is back in the menu as Devices, under
  Tools. Devices are YOUR machines and Teams are other people, and that is the
  whole difference between the two entries. It lists the Skales instances on
  your network, takes a remote one by address, shows what was handed back and
  forth, and delegates a task from a form. Nothing about how it works changed:
  the /swarm command in the chat, the peer scan under Settings, Advanced and
  the switch on the Add-Ons page are the same ones, and the old /swarm address
  still answers - it forwards to the new one, so a bookmark keeps working.
- **A long run says what it is doing, step by step.** The Skales Code window
  used to show the word "deciding" for minutes at a time, which is the same
  thing it shows when a run has died. Every step now records what it is - the
  tool, the file or command, how long it has been at it - and the status bar
  reads the newest one: "step 7 - write_file src/InputManager.ts - 12 s". A run
  waiting on your approval says that instead of claiming to work. After 45
  seconds of nothing at all (it used to be two minutes) the line names what went
  quiet, so you can tell a hung command from a slow model without stopping the
  run to find out. It survives a reload, because it is kept with the run and not
  in the window. Skales can also now tell you which script interpreters your
  machine actually has, rather than guessing and learning from the error.

- **Fold the sidebar with Cmd/Ctrl+B, and it stays folded.** The column
  remembers whether you folded it, across a restart and in both readings of the
  sidebar. Before this, a window you had given the extra width back to came
  back full-width every single time.


- **Skales opens the page instead of telling you where it is.** When the chat
  makes something that has a home - a poster or a video in Studio, a team run in
  the Organization, a task in the Cockpit, a document or an older conversation -
  it can now take you there. Ask to be shown something and the app goes; nothing
  moves that is not really there, because the addresses come from the navigation
  itself, and a surface whose add-on is switched off says which switch rather
  than opening a page that would only turn you away. In a Telegram or WhatsApp
  conversation, and while a job runs with nobody at the screen, nothing is moved
  at all - the place is named instead.

- **Your teams can be started from the chat.** The Organization no longer needs
  its own screen to be used: ask which teams there are, give one a job, or ask
  what a team is doing right now. A run started this way is the same run the
  Organization surface shows - it appears there while it happens - and it asks
  before it begins, because a team is minutes of work and one model call per
  member.

- **Each agent in a team run uses its own model again.** An agent card has had a
  provider and a model of its own for a long time, and a team run ignored both:
  every member answered from one shared model, however different their roles.
  Now a card's own model is used when it names a provider that has a key on this
  machine, and when it does not, the run log says so in a line instead of
  quietly falling back.

- **Four more places the conversation can reach.** The Group Chat room can be
  looked into and asked a question from the chat; the Desktop Buddy can be asked
  how it is and given a line for its bubble; your own Custom Widgets can be
  listed and read, so an answer about one is about the real thing; and the
  Discover feed can be read, with an honest "offline" instead of an invention
  when the machine has no connection.

- **Every conversation shows what it costs, and can stop itself at a ceiling.**
  A running price sits beside the context meter in the composer footer, each
  answer carries its own price in its token line, and the hover card says how
  much of the input came out of the provider's cache instead of being paid for
  a second time. Under Settings, Goals you can give a conversation a ceiling:
  at half of it and again at the ceiling itself Skales stops and asks, with
  three answers - carry on, switch to a cheaper model, or stop - and the
  question is answered here rather than by the model, so being asked costs
  nothing. A fresh installation starts with five dollars; a machine that
  already has settings is left exactly as it was.

- **Mail does what a mail program does.** Attachments are named on every
  listing and can be fetched into the workspace, a message can be read whole
  instead of as a preview, the mailbox can be searched on the server rather
  than by pulling everything down first, and a message can be put back to
  unread. Searching, reading whole and unread need a mailbox reached over IMAP;
  a Google account connected through Google says which of the four it cannot
  do, instead of answering as though it had.

- **Retrieval over your indexed documents has an off switch.** It sits at the
  top of the block that used to only ask which vector database to use, above
  that choice, because whether anything is looked up comes before where from.
  Switched off, nothing is read from disk and no embedding is paid for, the
  chat command for it says it is switched off instead of "no results", and
  Skales stops offering a search it would not run. A profile that never touched
  the switch keeps retrieval on.

- **The permission window in Skales Code says what a yes never covers.** Every
  window that asks you to allow a step now carries a line you can unfold: the
  handful of things that are always asked, whatever you allow, with one
  sentence each. A session-wide yes is a yes to the ordinary work and not to
  everything, and now it reads that way.

- **Searching your Code sessions finds what they say.** The box in the session
  column searches what was written in a session, not only its title, and the
  results replace the list in the same column: title, folder, date, and the
  passage the hit sits in with the found words marked. The box itself used to
  be two rows tall with the magnifier stranded above the field; it is one row.

- **The scratch folder a coding session works in has a door.** Skales gives
  every coding session a private folder for working files, and nothing in the
  window ever showed it. A line under the All tab of the file column names it
  with its file count and size, opens it in the same file tree the project
  uses, and a file in it opens in the same frame a project file does. It
  appears only when something is really in there, and clearing the session
  empties it.

- **The meter counts the model calls you never see a bubble for.** Two of them
  were free as far as the footer was concerned: the summariser that shortens a
  long conversation to keep it inside the model's window, and the vision model
  that describes a screenshot for a browser or computer-use step. Both are real
  charges on your key, and on a screenshot-heavy afternoon they are the larger
  half of the bill. They now ride on the step that made them and appear on their
  own line in the hover card over the token badge - never folded into the
  sub-agent line, which would name work that never happened. A price that cannot
  be known (a local vision model) still says nothing rather than showing a zero.
- **A sub-agent may not spend past the ceiling its conversation was given.**
  run_subagent and dispatch_subtasks had a step budget and no money budget at
  all - forty steps per child, as many children at once as the model asked for,
  and the session ceiling only saw the bill when they were all back. Each child
  now runs against what the conversation has left, and a child that reaches it
  says so in words instead of coming back with a bare "did not finish".

- **A recording that could not be transcribed is no longer lost with it.** A
  dictation that failed - a refused key, an empty balance, a dropped
  connection - printed "Transcription failed." and threw the clip away, so the
  only way forward was to say the whole sentence again at the worst possible
  moment. The recording is now held and the error offers to send it once more,
  through the same path that would have sent it the first time.

### Changed

- **Every Skales window now closes the way your operating system closes
  windows, and nothing else.** Iris Orbit had no title bar at all and drew its
  own small close disc - and only once it was listening, so during the intro
  and the name question there was no visible way out. Flow drew one too, in the
  corner Windows draws its own Close button into. Both are gone: Iris, Flow,
  Code and the main window now carry the same title bar - the traffic lights on
  macOS, the window buttons on Windows, the native frame on Linux - and the
  page paints nothing into that corner. Escape, Cmd/Ctrl+W and the right-click
  menu still close what they always closed.
- **On Windows, the window buttons no longer sit on top of anything.** Every
  header, rail and floating panel that reaches the top edge of a window now
  reserves the width the caption buttons actually take, measured from the
  system rather than guessed - on the left as well, for a right-to-left
  install. A window opened after you switch themes also opens in that theme
  instead of coming up with a black title bar until the page loads.
- **Studio Classic is down to what it is for: Media, Audio, Type and Gallery.**
  The Design and Scenes tabs are gone. Flow does that work now - it writes the
  same pieces from a conversation, and the multi-scene video lives there as
  Motion, with the timeline, the audio and the export card. The 3D room is
  untouched and still opens from the same door. An old link to one of the two
  retired tabs lands on Flow instead of an empty stage, and a scene render that
  was still running when you updated finishes into the gallery.

- **"Lean prompt" is now its own switch, so a hosted endpoint can send less
  without pretending to be local.** How much goes out per request - the short
  system prompt, the capped tool set, the rest a `load_tools` call away - used
  to hang entirely off "this endpoint runs on my own machine". That single
  question was doing two jobs: the tick decides privacy and what runs where,
  and it was also deciding your bill. There is a second switch next to it now,
  on by default for an endpoint that runs on your machine and off for a hosted
  one, settable either way per endpoint, per provider, or per model in an LLM
  profile. The line the model reads when its tool list was shortened names that
  switch instead of blaming "local models".

- **Reading a file no longer drags ninety tools in behind it.** The always-on
  tools ship on every turn anyway, but each is filed under a category, and the
  bookkeeping read "read_file was called" as "the whole core group is in use" -
  so the first file the model opened put ninety-odd extra schemas into every
  step that followed, paid for on all of them. A tool from the always-on set now
  brings itself and nothing else; the group behind it is still one load_tools
  call away. Measured over twelve steps of ordinary file work: 8.618 to 2.862
  tool tokens a step.
- **A missing tool costs one group, not the whole catalog.** When the model
  reached for a tool that was not in front of it, Skales reopened every schema it
  has for that turn. The refusal names the tool, though, and a named tool has a
  group - so that group is loaded and the turn runs again, which is the road the
  model would have taken itself. Only a name that belongs to no tool at all still
  opens the full list, because for that there is nothing to load.
- **The skill tools are one family again.** create_skill, test_skill, read_skill,
  list_skills, delete_skill and the two switches sat in a different group from
  the one the app said they were in, so asking for that group handed the model
  half a family. They are all in `system` now.
- **Running one at a time is now a property of the model, not a switch for the
  whole app.** The ask was to be able to run requests to a model one after
  another; a global switch would have taken parallel conversations away from
  everybody who runs a cloud model, which is most people. So the run order
  follows the model that will actually answer: a local runtime, or a model small
  enough that the machine is the ceiling, takes turns by default, and everything
  else stays parallel. A choice made in Settings still overrules that, and an
  LLM Profile overrules both - it says `one at a time` on the profile's own line,
  beside the other properties of that model. A team run whose seats do not agree
  takes turns, because the card that holds one model decides for the run.
- **Asked how it is built, Skales answers instead of refusing.** The prompt used
  to forbid the model outright to look at Skales' own source, which made it
  stonewall even a user who had bound that very folder as a project. It now asks
  for honesty: answer from the docs, the changelog and check_capabilities as far
  as they reach, say "not documented" when they do not, invent no internals - and
  a bound Skales source folder is a folder like any other.
- **The Cockpit reads as one screen again.** The board no longer grows without
  a ceiling: at fifteen cards it took most of the page and pushed everything
  under it out of sight. The four columns now stop at a share of the window and
  each one scrolls itself - and a board with three cards on it is still three
  cards tall, not a fixed grey rectangle. Under it, Goals, Schedule and Tasks
  are the same accordion with the same shape: the name is said once, in the lid,
  and the page headings that stood one line below it are gone, along with
  Schedule's screen-high floor and the second "Goals" inside the Goals lid.
  Each lid now carries the same one-line summary - how much is moving, how much
  is done, when the next run fires and what it has cost - with the words in the
  tooltip. On their own routes the three pages are unchanged.

- **"Beta" is said in one place, so it means something again.** The word stood
  on the Plugins page, on the Teams surface, on navigation rows and under the
  Skales+ waitlist - five marks for surfaces that have shipped. It now sits
  beside one heading only: Skales Local, under Settings, which brings its own
  inference server and its own models. The bundled manual carries the same one
  mark, and no menu row carries any.

- **Choosing Auto is the whole answer.** Auto mode pre-approves file and shell
  work inside the folder a coding session is bound to - that is what it is for -
  but it only did so when a second, separate opt-in had been recorded somewhere
  else. The Code window never asked for it, so a session started there on Auto
  stopped on the first write into its own bound folder, and the card explained
  the stop with *Auto waves through changes inside the folder, and this is not
  one of those* about a file that was inside it. Picking the mode is now the
  consent, on every surface that offers it. Nothing else moved: work that
  reaches outside the folder, a push, a deploy, a destructive command and every
  network tool still ask, and the folder rules and the blocked-command list are
  untouched.
- **Every mode says what it may do.** Ask, Code, Plan and Auto are four words on
  four small pills that decide how much a session can do without you. Each one
  now carries its own sentence, on the pill, so the reach of a mode is readable
  where the mode is chosen.

- **Organization, Browser and Playbooks have their doors back.** Two people
  asked for Organization in one week after it lost its menu entry, which is the
  answer to whether taking it out was right. All three stand under Tools and in
  the chat column's More block, and each opens the same surface its own page
  renders.
- **An add-on you switch off takes its menu entry with it.** Turning Wrapped or
  Skales Code off left the entry standing in the sidebar and the page answering
  as though nothing had been decided. Now every surface with a card on the
  Add-Ons page obeys that card everywhere: out of both sidebars, out of Cmd+K,
  out of the pins. The page itself stays reachable and says where the switch is
  instead of showing you a blank screen.
- **The Cockpit's Control Room is gone, and its eight controls are where they
  belong.** The deep-dive interview, the daily stand-up and the button that
  lifts a spending pause are at the head of the Cockpit, beside Pause and
  Resume. When the autopilot may be awake, what it may spend in an hour and
  when it stops by itself are settings rows under Settings, Goals. The line you
  type straight into the queue is at the head of Tasks, over the queue it
  writes into. The reset for a wedged scheduler is under Settings, Advanced,
  Diagnostics, where a person looks when something is stuck.
- **One popup frame instead of two.** The settings jump out of the Guide had a
  hand-copied frame of its own, which is why it kept clinging to the window
  edges on a wide screen while every other panel had learned to keep a margin.
  There is one frame now and both open it.
- **The Guide has one door.** It lives in the System button in the sidebar
  foot, with Diagnose, Update and Report Bug - the four things about the
  machine itself. The row that said the same thing a second time is gone.

- **The prompt behind every turn got smaller.** Skales handed every model the
  full description of every tool it might want, on every single turn, plus a
  few lists that only matter on the rare turn they are about. The permanent set
  is a third smaller, the rest is fetched by group the moment a turn needs it,
  and every promise the prompt makes about a tool that is not in the turn yet
  names the group it comes from, so a model asks for it instead of guessing at
  a name. On a provider that charges for the prompt, that is money back on
  every step of a long run.

- **A sub-agent runs on the model you chose for it, and says what it cost.**
  Handing work to a sub-agent allowed exactly two answers, the parent's model
  or one fixed fast one; any model you have configured can be named now,
  including one written the way your provider writes it. Each child appears in
  the chat as its own chip with its state, its model and its price, so a step
  that quietly ran on the expensive model is visible while it happens instead
  of arriving as a line on the bill.

- **Telegram and WhatsApp count money per conversation and per day.** The
  spending leash started again at zero for every incoming message, which is no
  leash at all on a channel where messages arrive one after another. It runs
  over a conversation and over a day now, and when it stops a run it says in
  half a sentence which of the two you met and how it differs from the ceiling
  that governs a conversation at the computer.

- **A new installation starts with memory switched on.** The knowledge graph
  and the nightly distilling of finished conversations shipped switched off, so
  the two features that make Skales remember you were only ever found by people
  who went looking. They are on for a fresh install, each row says what it
  costs before you decide to leave it on, and a machine that already has
  settings keeps every choice it made.

- **A long diff arrives folded, and Keep and Revert appear only where they mean
  something.** A change of a hundred and fifty lines unrolled into the
  transcript in full; it comes folded now, with a line saying how much is
  behind it, and a short one stays open. The two decision buttons used to show
  under anything that vaguely resembled a file, including text that was not
  one; they appear on a real change to a real file, and each says what it does
  when you rest on it.

- **A tool group that nobody uses stops riding along.** Loading tools on demand
  only ever added: a group the model pulled on the third step was still being
  paid for on the fiftieth, because the whole conversation was re-read as
  "loaded" on every turn. Now a group nobody has asked for or called in four
  steps is dropped, and pulling it back is the same one-step request it always
  was. A group in genuine use refreshes itself with every call and never
  expires. Measured over a twelve-step run with three loaded groups, the tool
  payload falls by up to 22% per step; over a fifty-step one, by 20% on average.
- **A model that keeps asking for tools gets the ones it asked for.** When a
  weaker model loops on the load-tools request without ever using what it
  loaded, Skales steps in so it cannot stall. It used to do that by handing over
  the entire catalogue for the rest of the turn - the most expensive corner of a
  turn, on the model least able to use it. It now hands over exactly the groups
  the model named. The full catalogue stays for the one case the narrow answer
  cannot serve: a model that named nothing that exists.

- **A voice you picked is only ever sent to the service it belongs to.** The
  voice Iris and Call Mode speak with was stored as a bare name with no record
  of which service it came from, so an ElevenLabs voice went out to OpenAI as
  if it were one of theirs, came back refused, and was reported as "the chosen
  voice produced no audio" about a voice that works. A voice now carries its
  engine, and a choice made for one service is never handed to another.
- **The female Spanish voice is on the phone's list again.** It shipped in the
  app and was missing from the list the relay serves, and the served list wins -
  so the voice disappeared from the download screen the moment a device came
  online. The list now carries it, states which speaker of that archive is the
  woman, and says of every voice whether a listener hears a woman or a man, so
  a surface that asks for a female voice can be answered instead of guessed at.
- **One voice, one name.** The same archive was called three things across the
  desktop catalogue, the relay's list and the phone's - somebody who had heard
  of a voice under one name could not find it under another. Every voice is now
  named once, in the spelling that was already published, and a gate holds the
  lists to it.

### Fixed

- **A Studio visual that animates in now plays instead of freezing on its first
  frame.** A headline arriving word by word is invisible at its own start; the
  guard that rescues a page whose entrance never fired read that as a failure
  and switched the animation off. A page whose text is animating right now is
  left alone, and only the last-resort check seven seconds in still overrides it.
- **The feed no longer names a surface Skales does not have.** A finished
  Codework run posted "completed a Codework session" - and posted the project
  folder's name with it, into a public feed. It now posts the same content-free
  coding event the Code window posts, and the folder name stays in the private
  local log. The Buddy is the Buddy, not the "Desktop Buddy", and the example
  the post-writer is shown says Skales Code like every other line already did.
- **A Playground Space you share actually arrives.** The share sent an event
  name the feed had never heard of, so the post was refused and disappeared
  without a word.
- **`http_request` no longer gets turned away by sites that refuse nameless
  robots.** The tool sent no User-Agent at all, so Wikipedia and other Wikimedia
  sites answered a perfectly correct call with 403. It now identifies itself as
  Skales, the same way the page-reading tools already did. A User-Agent you set
  yourself still wins, and no browser is impersonated.
- **A conversation carried over from Iris keeps its bill.** The transcript Iris hands to the runner now travels with what each turn cost and which rows were Skales' own cards, the way the Code window already does - so the session ceiling counts an Iris conversation too, and its stop card is never read back to the model as ordinary text.

- **The closing report of a coding run counts your work, not your
  dependencies.** A run that installed packages in a folder without a
  .gitignore signed off with "2109 files changed (+956818)" - a number about
  npm. Dependencies and build output are now left out of the count whatever the
  folder's ignore rules say, and a lock file counts as the one file it is
  rather than as forty thousand lines.
- **The spending ceiling's card has its buttons in the Code window.** The
  session ceiling stopped a coding turn with the sentence "nothing more will be
  sent until you decide" and nothing to decide with: the three answers were
  written into the session and this window drew only the prose. Continue,
  Cheaper model and Stop are now on the window's own question card, answered
  the way the chat and the phone answer them - Continue re-runs the turn that
  was refused rather than sending the word "Continue", Cheaper model opens the
  picker in the composer, Stop stays stopped - and none of the three costs a
  model call. The card also loses its "something else" box wherever Skales is
  the one asking, on both surfaces: free text there was read as "carry on".

- **A budget notice appears while you are looking at it.** A turn the ceiling
  refuses is over before it starts, so the Code window - which re-read the
  session only when a run visibly moved - showed an unanswered question and no
  reply until the next reload, which looks exactly like a hang. The window now
  follows the turn it just started, and hears it end even when it never saw it
  running.

- **Raising a spending ceiling wakes the conversation it stopped.** After the
  ceiling was lifted the next turn started and the assistant answered "I can't
  run that, this session has passed its cost ceiling" - to the person who had
  just raised it. The stop card is a message from Skales to you, with three
  answers this computer reads itself; it was also being handed to the model,
  which read the transcript refusing to spend and refused again. It now stays
  in your transcript, where you need to see it, and out of what goes to the
  model. The same on the phone.

- **A project folder inside a bigger checkout no longer reports the whole
  checkout as its own work.** Point a coding session at a folder that has no
  `.git` of its own and git answers for the repository above it - so the
  changed-file list, the +N -M counter and the "commit N files" button were all
  describing a checkout this session had never touched, and pressing commit
  would have staged it. The list, the counter, the suggested message and the
  commit are now scoped to the folder you bound, the files are named as you
  would open them, and a line under the branch says the repository root is
  further up.

- **A sub-agent can use the tools it was given, whichever name it types for
  them.** Every child gets a file listing, and children were being told the
  listing was not available to them - so they ran `ls` through the shell
  instead and stopped to ask permission for it. The permission gate compared
  the name the model wrote against a list that only holds one spelling per
  tool, while the tool itself has always answered to both. It now resolves the
  name first, and only through the fixed alias table: a nickname can open a
  door your run already holds open, never one it holds shut.

- **Sub-agents started together each get asked, instead of the first one taking
  the only card.** A fan-out whose children all wanted to write a file used to
  finish one of three: the first child's question went on the card, and the
  other two were told there was nobody to ask and wrote nothing. Children now
  queue for that card and you answer them one after the other, so all three
  finish - or the ones you said no to say so by name.

- **The Code window comes back to the session you had open.** Reloading was
  meant to reopen the transcript, and after visiting any other view it stopped
  doing so: arriving at the Code start screen threw away the pointer to what
  should come back. Opening Code from the sidebar still starts fresh; a reload
  now finds the conversation again, mid-run card included.

- **The spending ceiling applies in the Code window too.** A coding session
  handed its transcript to the runner without the prices on it, so the ceiling
  counted a conversation that had never paid for anything and never showed its
  card - on the surface that spends the most, because a coding turn pays for
  its sub-agents as well as itself. The meter, the warning and the stop card
  now see the same dollars the context panel shows.

- **A Flow project says what it is doing while its tab is closed.** The run
  itself always kept going on the server and reopening the project picked it
  back up - but from the project grid a working project looked exactly like a
  stopped one, and a project parked on its scoping questions looked like one
  that had given up. Cards now say "Still working" or "Waiting for you".

- **A new conversation is named once, not twice, and not with the whole agent
  prompt.** Two title passes ran for every session; one of them sent the entire
  agent identity along to produce six words. There is one now, it carries a
  two-line prompt of its own, and it runs at most once per session - the chat
  page, the Code window and the run itself all ask, and only the first ask
  reaches a model. A naming pass that came back with nothing usable is not
  repeated over the same unchanged first exchange either.

- **The part of the prompt that describes you stops changing under the
  conversation.** The identity paragraph carried three counters that are
  incremented the moment a turn ends - how many conversations there have been,
  how many interactions, a trust percentage - and a list of recent-conversation
  summaries that gains an entry per turn. So turn two of a conversation sent a
  different paragraph than turn one, and it sits in the cached part of the
  prompt. Those values are now held still for the length of a session. Anything
  you changed on purpose - a saved fact, a learning, the character settings -
  still arrives on the very next turn, and the clock still says the real time.

- **The planner no longer generates a plan just because you opened it.**
  Finishing the setup - "Skip to Calendar" included - started a paid day-plan
  request. A plan is made when you press Generate Plan.

- **The clock in the prompt tells the actual time.** It said "this is the real
  current time NOW" while being rounded to the top of the hour, so an assistant
  asked at 05:55 wrote 05:00 into a file, and a whole hour of requests read the
  same time. It is accurate to the minute again, and it sits where being
  accurate costs nothing.

- **A long run stops paying for its own prompt again on every step.** The live
  working-state note - step number, last result, the file ledger - was written
  into the system prompt, which made the prompt a different string on every
  step, so no provider's prefix cache could ever match it: one measured build
  went from 9k to 58k input tokens per call with not a single cache hit, about a
  million input tokens for one job. The note now sits at the end of the
  conversation where it belongs. The model reads exactly the same thing; the
  prompt stays identical from step to step, and providers that cache it charge
  for it once.

- **`src/systems` and `src/scenes` are your folders again.** A project folder
  whose name merely resembled a system location - every game, ECS, Unity or
  Phaser project, and any folder called `dev/` - was refused with a security
  message, and the model quietly built the project under different names. Real
  system locations and credential folders still refuse wherever they sit; your
  own project folders are yours.

- **Setting up your own endpoint now asks which model it serves.** An endpoint
  saved without one made the chat send a hosted catalogue's model id to a
  personal server - which either answered as something it is not, or refused
  with "model not found" - and sent Studio to OpenRouter with a Claude model,
  telling people whose only provider is their own server to add a key for a
  service they never chose. The setup card asks for the model, with a Fetch that
  reads the list off the endpoint and fills the field, and it asks whether the
  endpoint really is a small model on this machine. A turn with no model set
  says so instead of guessing, and Studio stays on your provider.

- **Your Brand Kit actually reaches the design that gets built.** Flow said a
  kit was active, then asked what colours you wanted and built a deck and a logo
  animation in colours the kit does not contain: the kit was never in the
  prompt, and the tool that reads it was the first thing every tool budget threw
  away. Flow now opens with your saved kit selected, the tool that reads it is
  protected the way the file and shell tools are, and the kit's colours, fonts,
  tone and logo go into the run.

- **A custom endpoint is local only if you say it is.** An address on your own
  machine was taken as proof of a small model, so a proxy, tunnel or relay in
  front of a large one was served a compact prompt and a quarter of its tools -
  and then blamed "Max tools for local models" for a tool it had never lost. The
  switch on the endpoint decides now, and an endpoint you have not marked as
  local is treated as a full one.

- **A sub-agent's approval reaches you, and a sub-agent that never got one does
  not claim it finished.** Two helpers were sent off to write a file each; both
  writes needed your yes, no card was ever shown, and the report came back
  "2 of 2 finished" over two files that did not exist. A helper's question now
  lands on the same approval card as the run that started it, saying which
  helper is asking, which tool and which file. Answer once and the helper
  carries on; say no, or send the work off to run unattended where nobody can be
  asked, and it stops and tells you that is what happened - counted as
  unfinished, on the report and on the Tasks page.

- **A long build is no longer mistaken for a stalled one.** A goal that had
  written fifteen modules and got its build green was stopped at step forty
  with "nothing produced", because only bookkeeping counted and a build run
  does its work long before a step is checkpointed. Every file written, every
  edit applied, every command that ran and came back clean now counts as
  progress, and it travels with the goal, so a reloaded run keeps what it
  built. A run that only reads and searches still stops and asks, which is the
  case the halt was built for.

- **A skills repository is imported in one download.** The batch import asked
  GitHub for the branch listing and then pulled every file of every skill one
  request at a time, so a repository of nineteen skills was several hundred
  calls: slow on a good line, and on a bad one a skill landed without the
  scripts its own instructions point at. The whole branch now arrives as a
  single archive, folders and all, and the file-by-file route stays as the
  fallback for what the archive cannot serve. When GitHub does refuse, the
  answer reads its headers and says how long the wait really is instead of
  guessing an hour.
- **A typed "Stop" stops the run, at once.** The word was let past the queue
  and then walked the ordinary send path, which asks the server a question
  before it does anything else - so the word sat in the composer, nothing was
  drawn, and the turn carried on while the Stop button beside it worked. It now
  presses the same switch that button presses, before anything else happens,
  and clears what you typed. With nothing running the word is an ordinary
  message again.
- **A typed "Stop" is answered where you can see it.** The confirmation was
  written into the conversation right after the run it stopped, which is the
  same shape a further step of that run has, so the transcript folded it into
  the bubble above and drew nothing. The stop had worked and read as ignored -
  the exact complaint the stop word exists to end.

- **A finished coding run no longer claims Skales was closed under it.** A
  Skales Code run that ended normally, with the window still open, could put
  "Skales was closed while this session was working" over its own summary line
  and leave it standing until the session was reopened. Nothing had crashed: a
  turn ends in two writes, and the window happened to look between them. The
  writes now happen in the order that never spells a death, a run whose last
  moments are still being written is read as finishing rather than interrupted,
  and the window asks twice more before it puts the notice up. A real
  interruption - the app killed mid-run - still says so.

- **A run that ends without you stopping it says so.** A model call that sent
  nothing back for five minutes - a local model finding its first word, a long
  hidden deliberation - was taken for dead and swept away, even though the wait
  Skales allows for exactly that is ten minutes. The run then ended in complete
  silence: no answer, no reason, your question still on screen. Two things
  changed. A step waiting on the model now keeps the run marked alive, the way
  the tool calls around it always did. And when a run is ended by something
  nobody pressed - the sweep, a crashed runner, a restart mid-work - it writes a
  line into the conversation naming which of the three it was, and says that
  nothing above it was lost. A stop you pressed yourself still says nothing
  extra: you already know.

- **Skales no longer asks permission for something it will refuse anyway.** A
  coding session bound to a folder outside your file access rules worked for
  minutes, stopped and asked to write a file, waited for the yes - and then the
  file guard refused the write, because that had been decided before the first
  word was written. The rule is asked first now: when it forbids the path there
  is no card, just the refusal, naming the folders that are allowed and where
  the list is widened.
- **A folder Skales may not write in says so at the top, not at the end.**
  Opening a project that lies outside the file access rules now puts one line
  above the composer saying exactly that, with the folder and where to add it.
  It was already the empty state of the file column, which is not open while you
  type.
- **A permission card names the real reason it appeared.** Under Auto the card
  had one explanation for every stop, including stops that had nothing to do
  with folders. It now says *this reaches outside the folder* only when the gate
  actually decided that, gives the gate's own reason when there is one, and says
  nothing extra when the question already speaks for itself.
- **A run that stops to ask reaches the window you left open.** The Code window
  stopped listening while it was not the window in front of you - which is
  exactly how a coding run is watched: send the job, do something else, come
  back. A run that parked on a permission question went on showing *the model is
  answering* with a frozen clock until the session was closed and reopened. The
  window now keeps following a live run wherever it sits, and a run waiting for
  you counts as live, so the card arrives on its own and the time it has been
  waiting keeps counting.

- **Skales stops telling you it has no Node.** On a machine without a separate
  Node.js install, asking for a script to be checked answered *Interpreter
  "node" not found on this system* - from an application that is itself made of
  Node. It now falls back to the runtime it already runs on: a Node you
  installed yourself is still used first, and only when there is none does
  Skales offer its own. That reaches the shell too, so a command that spells
  `node` finds one as well, and MCP servers and language servers that need
  `npx` stop failing on a fresh Windows machine. npm is the honest exception -
  Skales ships a Node runtime and not npm, so when npm is genuinely missing it
  says so and tells you to install Node.js, instead of failing with a stack
  trace. If a script fails now, the error names which interpreter actually ran.

- **Auto mode stops asking permission for Skales' own scratch folder.** A coding
  session has a working folder of its own that the assistant is told to use, that
  is deleted with the session, and that has nothing to do with your files - and
  Auto raised an approval card every time anything was written there. It was the
  one card that could only ever be answered yes. Writing outside the project,
  pushing, deploying and every destructive command still ask, exactly as before.

- **The work a provider interrupted actually comes back.** After a turn died on
  a 402 or a rate limit, Skales was supposed to put the unfinished items from
  its own checklist in front of the model on the next turn, so "continue" was
  not a word it had to interpret. It never did: the check looked at the end of
  the conversation, and the end of the conversation was the message you had just
  typed, so the answer was always "nothing to resume". The message being sent is
  no longer mistaken for the conversation moving on - and tapping "Not now" on
  the offer still means not now.

- **The session budget also holds for a chat sent from your phone.** The ceiling
  under Settings, Goals is a ceiling on a conversation, but it was only checked
  for turns started at the computer. A turn typed on the phone runs through a
  different path and walked straight past it, on the same conversation and the
  same money. Both paths now ask the same ceiling and produce the same card, and
  the card reaches the phone. The ceiling and the per-day budget on Telegram and
  WhatsApp each say in one half-sentence which of the two you just met.

- **A local model with tools switched off can write a document again.** Skales
  told every model to put documents in the Document panel by calling a tool -
  including models that have no tools at all, because the tool budget or the
  endpoint switch turned them off. Those models followed the other half of the
  instruction, the half that says not to put the document in the chat, and the
  answer arrived nowhere. A turn without tools is now told about the other way
  into the panel, and told to answer in the chat if even that is not possible.

- **Gemini speech models can speak.** Picking a Google text-to-speech model
  under OpenRouter produced "OpenRouter returned no audio" every time. Those
  models accept only raw samples, Skales asked every model for MP3, and the
  400 that came back said so in a sentence nobody ever saw. The request format
  now follows the model - raw samples for the Google family, MP3 for the rest -
  the samples get a WAV header from the rate the answer itself states, and the
  browser, the Studio, the AIPointer overlay and the Telegram and WhatsApp
  voice notes all play what actually arrived instead of what was assumed.
- **A voice that will not speak says why.** The reason OpenRouter gives -
  a refused key, an empty balance, an account setting that rules an endpoint
  out, a format it does not take - now reaches the preview line and the note
  under the answer, in OpenRouter's own words. "Returned no audio" is kept for
  the one case that means it: an answer that really was empty.
- **Settings says who is speaking.** A line at the top of the speech block
  names the voice that will actually be heard, resolved the way the cascade
  resolves it. An on-device voice set as the main one speaks before any
  provider you picked, deliberately, and the line now says that instead of
  leaving a screen where the highlighted tile, the hint underneath it and the
  voice coming out of the speaker were three different answers.
- **The speech voice is chosen where it is heard.** The voice for OpenRouter
  moved out of the provider card into the speech block, and it offers the names
  the chosen model accepts - the six OpenAI names, or the Gemini names for a
  Google model. The block used to show a browser voice list that did nothing
  while the working field sat on another screen.
- **Iris keeps her voice on the on-device path.** Iris asks for a female voice.
  The request stopped at the door of the on-device engine, so she spoke with
  whichever single voice was installed. The catalogue now states the gender of
  each voice, the preference picks among the voices for the language being
  spoken, and when there is no matching one the answer says which voice spoke
  and why instead of quietly swapping her.
- **Listening can be switched on.** Setting the on-device engine as the ear
  needs a model, and the model picker only appeared once the ear was already
  on - a circle with no way in, which sent the setting back to off without a
  word. The picker is always there, a click carries the only installed model
  with it, and a role the store refuses is now said out loud.

- **Stop stops.** Pressing Stop wrote "stopped" into the record and left the
  work running: a script that had been started kept going, everything it had
  started kept going, the next tool in the batch still ran, and the chat could
  sit there looking idle while money was still going out. Whoever ends a run
  now ends the runner with it, on every route into it - the button, the word
  "stop" typed into the chat in any of the twelve languages Skales ships, and
  the sweep that retires a run nobody is watching. The signal is checked before
  every single tool of a batch, a running command is taken down together with
  the processes it spawned, and a browser step closes its page. A long tool
  call no longer looks abandoned while it works, so it is not retired out from
  under you, and while any loop is alive the chat says it is running instead of
  reading a record that says otherwise. Quitting Skales takes the whole tree
  with it, and a server whose app is gone ends itself.

- **Skales no longer hands out its own stored credentials.** The file holding
  your mail login was refused to the file reader and to nothing else: a script
  or a shell command could open it, a search one folder up printed it line by
  line, and Skales' own instructions actually named the file as something worth
  inspecting. In one reported run a model read the password out of it, logged
  into the mailbox by itself and marked seven hundred and sixty-three messages
  as read. Every stored credential file is refused now to the file tools, to
  the shell, to scripts and to search, in every mode including the unrestricted
  one; a search skips them rather than printing what reading them would have
  refused, and the instructions say to work through the mail and integration
  tools instead of signing in by hand.

- **Your mail password is no longer written down in plain text.** Provider keys
  have been kept encrypted for a long time; the mailbox password sat beside
  them readable, in the file and in every copy of it - a backup, a sync folder,
  a screenshot, a transcript. It is encrypted at rest now, in both places it
  was kept, and an existing account is converted the next time Skales loads it,
  with nothing for you to do. Honest about the reach: this stops the password
  from being readable, it is not protection against somebody who already has
  your machine.

- **Nothing changes twenty things in your mailbox without asking.** One
  instruction can carry a loop, and a loop is where a small mistake becomes a
  large one. Past twenty changed messages in a session Skales stops and asks,
  and it asks in the unrestricted mode too, because that mode is about trusting
  your judgement rather than about not being told. The count is kept on disk,
  so it survives a restart in the middle of a run, and a yes covers what was
  asked and not everything after it.

- **Marking a message read works, and so do moving and deleting.** On a mailbox
  reached over IMAP the step that changes a message never opened the mailbox it
  was about to change, so the change went nowhere and the answer said it had
  worked. It hit the three most common ways of naming folders, which is to say
  most of the mailboxes people actually have, and the same one cause broke
  moving to another folder and moving to trash. All three do what they say now,
  and the connection is closed even when a step fails.

- **An answer written while the phone bridge was down is delivered when it
  comes back.** If Skales was closed in the middle of a WhatsApp job the job
  was picked up again at the next start, and its finished answer was thrown
  away with a line in a log, because the restart that revived the job had not
  brought the bridge up yet. The answer is kept now and sent once, with the
  time it was written and a note saying it is arriving late.

- **A Telegram message waiting for your permission stays visible.** A turn that
  stopped to ask you something closed its own record on the way out, so the
  list of what is running showed nothing and the run looked finished. It shows
  as waiting for permission with the time it started waiting, it closes when
  you answer, and a run that was waiting when Skales was killed comes back
  waiting rather than as something to continue.

- **A screenshot is handed over once, not on every step afterwards.** Every
  further step of a turn re-sent the whole picture, so a run that took a
  screenshot early paid for it again and again. The picture goes into the turn
  once; after that the step carries the description and where the file is.

- **A retired model says that it is retired.** A model its operator has
  switched off answers with a status that fell through every rule and arrived
  as a bare error, so it read like a fault in Skales or in your key. It is
  named for what it is now, in twelve languages, with the advice to pick
  another model. An account without credit is deliberately not called a dead
  model: that is a different problem with a different fix.

- **A tool that twice returns nothing useful is not asked a third time.** A run
  could spend its whole budget rephrasing the same fruitless lookup. After two
  empty answers from the same tool that channel is closed with a sentence
  saying what could not be verified and why, and the run carries on with what
  it has. A real find resets the count, and nothing is taken away from a run
  that is getting somewhere.

- **Right-click, Download in Skales Code saves the file.** It worked most of
  the time and failed the rest, for a reason that had nothing to do with you:
  the download was cleaned up in the same breath it was started, so whether it
  arrived depended on how busy the machine happened to be. It arrives now, and
  a download that genuinely fails says so on the screen instead of nowhere.

- **"Always allow, this session" survives a reload.** The answer was held only
  in memory, so reloading the window, or Skales rebuilding a piece of itself in
  the background, threw it away and the same question came back a few steps
  later. It is written to the session now and comes back with it. It still
  covers only that session, it still lifts no guard, and clearing the session
  throws it away in both places.

- **Switching Skales Code off closes Skales Code.** The switch on the Add-Ons
  page left the window and its address working exactly as before. The surface
  says which switch turns it back on, and it waits until the add-on list has
  really been read, so the notice does not flash up on every start.

- **A reload reopens the session you were in.** Reloading the Code window
  dropped you on the start screen, with the session you had been working in one
  click away and no reason given. A reload comes back to it; opening the window
  fresh still starts where it always did.

- **A command you run gets your shell, not the app's build environment.**
  Skales handed its own build settings down to everything it started, so an
  install inside your own project quietly skipped the development dependencies
  and left you with a project that would not build. The build settings stay
  with the app now, and anything you run sees what it would see in your own
  terminal.

- **A command that did its work and returned a non-zero code no longer reads as
  a total failure.** Plenty of useful commands end with a non-zero code and a
  perfectly good answer on their output, and that answer was replaced with
  "command failed", which sent the model looking for a problem that was not
  there. A run like that says which code it ended with and shows what it
  printed. "Failed" is kept for the cases that earn it: no output at all, an
  error stream, or a timeout.

- **A file you attach to a coding session can be found by it.** A session bound
  to a folder was told the file's name and nothing else, so the first thing it
  did was hunt for it, sometimes in the wrong place. The note carries the full
  location now, for video, documents, spreadsheets, archives and anything
  binary alike.

- **The GPU badge in Skales Local now says what happened, not what was hoped.**
  It used to read "GPU" whenever the bundled engine had been built with a
  graphics backend, whatever the machine then did with it - so two Linux users
  with an RTX 3070 watched it say GPU while llama-server was reporting that it
  had asked for 999 layers on the card and put nothing there, and the whole
  model was running on the processor. The badge is now read from what the engine
  actually loaded. Until a model has been loaded it says "GPU build" instead of
  claiming a run that has not happened, and when nothing goes across it says CPU
  with the reason underneath: no Vulkan driver found on this machine, no
  graphics device found, or a card that was found and given no layers - each
  with the next step, which is a different one in every case.

- **A local model on the processor is given the time it needs, and the message
  says so.** A model computing on the processor takes minutes a turn, and the
  fixed request budget cut it and reported "the connection to the provider
  closed before the model finished answering". Nothing had closed. Skales now
  measures how long this machine is actually taking with this model and lets the
  budget follow it, and a turn that is still cut short says how many seconds a
  turn has been taking and where to look, instead of blaming a network that was
  never involved.

- **Qwen 3.5 no longer prints its own tool calls into the chat.** Served through
  llama.cpp, Qwen 3.5 writes a tool call in a dialect the endpoint does not
  translate, so the raw markup arrived in the answer and the tool never ran -
  reported by a user whose model tried to read an image and printed the attempt
  instead. Those calls are now recognised and executed like any other, and
  anything left over is cleaned out of the answer. Skales Local also reads what
  the running engine says about a model's image support, so a local model with
  its projector in place is no longer judged by its name alone.

- **Updating no longer leaves processes behind.** The restart that applies an
  update tore the app down with a shorter routine than an ordinary quit uses -
  one that stopped the web server and the bots and never touched the local model
  engine. Two Linux users were left with Skales and llama-server processes still
  running after the update finished. The update now uses the same teardown as a
  normal quit, including the sweep for orphaned engines.

- **On-device voices no longer fail with "Please check your config!"** Every
  Piper voice on a machine could refuse to speak because the shared speech data
  had once been half-created: Skales checked that the folder existed rather than
  that it was complete, so the full copy inside each newly downloaded voice was
  deleted on arrival and the broken folder was kept. It is now checked for the
  files the speech engine actually validates and replaced when any are missing,
  and if a voice still refuses, the message names the folder and the missing
  file instead of four words that point nowhere.

- **A browser click that moves nothing is no longer called a success.** Asked
  to post on X, Skales wrote the text into the composer, clicked Post at
  coordinates a vision model had guessed, and the page did not move - and the
  click was still reported as having worked. Reading the timeline afterwards,
  the model found a post from a year earlier and announced that it had
  published. Nothing had gone out. A click is now measured on both sides on
  every route it can take, and a page that did not move is a failure that says
  so and says what to do instead. A click aimed at Post, Send or Submit comes
  back with either the address that changed or the words "publication
  unconfirmed", and the answer states plainly that a post visible in a
  screenshot is not proof that yours went out - it may be an older one, or
  somebody else's.

### Security

- **Every connected account's credential is encrypted on disk.** The mail
  password already was; the Telegram bot token, the Google account's refresh
  token, the Discord, Slack, Signal, Notion, Todoist, Spotify, YouTube, Home
  Assistant, Twitter/X, Outlook and VirusTotal keys and the webhook secret were
  written in clear text beside it. All of them now go through one gate on the
  way to disk and back, with the per-installation key the rest of Skales
  already uses. A store that still holds a clear-text key is sealed the first
  time it is read and never again after that, so nothing has to be re-entered.
  A backup still travels as portable plaintext and a restored one is sealed
  again with this machine's key, so moving an install keeps every connection.
- **Publishing asks once, in every safety mode.** Unrestricted Mode says "stop
  asking me whether this is risky"; it never said "publish in my name without
  telling me". The first call of a conversation that puts content where other
  people can see it - a tweet, a WordPress post or page, a Slack, Discord,
  Signal, WhatsApp or Telegram message, an FTP upload, or a browser click on
  Post, Send or Submit - comes back as the same approval card the mailbox
  volume check uses. Answer it once and the rest of the run goes through; the
  answer survives a reload, so a resumed run cannot publish without ever having
  asked. There is no new setting, and Auto cannot turn it into a standing yes.
- **The blanket "approve everything in this session" answer survives a
  reload.** Its marker was an invisible character, which the session file's own
  cleanup quietly rewrote into something the reader no longer recognised - so
  the card came back after a reload even though it had been answered. The
  marker is now written out in full, and an answer given by an older build
  still counts.

## v12.9.25 - Backbone

### Added

- **Memory refuses to hold your secrets.** A saved memory is not stored once
  and forgotten: it is read back into the prompt of every later conversation,
  on whichever model you point Skales at next. So a value shaped like a card
  number, an IBAN, an API key, a token, a password or an id number is no longer
  written down. Skales says plainly that it did not save it and where the thing
  belongs instead - a provider key goes in Settings, where it never enters a
  prompt. Ordinary facts are untouched: a budget, a phone extension, a version
  number and a time of day all still get remembered. If you genuinely want such
  a line kept, there is a switch under Settings, Memory; the background pass
  that distils facts out of finished conversations ignores it and never keeps
  one, because nobody asked for what a background pass happened to notice.
  Automatically distilled facts are also capped at one line, so a paragraph can
  no longer arrive as a "fact" and sit in every prompt afterwards.

- **A tool cannot act on something it never saw.** Before Skales sends a mail,
  changes a WordPress post, moves a calendar entry, deletes a file or updates a
  task, it checks that the thing it is about to touch actually came up in this
  conversation - from something it read, or from something you typed. An
  identifier the model produced out of thin air no longer reaches your site,
  your mailbox or your disk: the step stops, says which identifier it does not
  recognise and which lookup would settle it, and the run carries on from
  there. The check happens before you are asked to confirm anything, so a
  confirmation card is never a question about an invented id, and what a
  conversation has looked up stays with that conversation - a second chat
  starts from nothing, and a run that survives a restart keeps what it knew.

### Changed

- **One engine drives every run.** Chats, scheduled tasks, cron jobs, plugins,
  webhooks, Discord, Telegram, WhatsApp and the desktop Buddy now run the same
  agent loop, with the same guards and the same budget. A request no longer
  finishes when you type it and gives up early when it runs unattended.
- **The budget you set now holds everywhere.** A Buddy bubble, a scheduled
  task and a message sent from Telegram or WhatsApp are counted against the
  same token and spending limits as a chat, sub-agents included. A run that
  stops because it reached one says so, instead of blaming the work - and the
  four of them now show up in the run list while they work, so a long one can
  be watched and stopped. If Skales closes mid-task, a Telegram or WhatsApp
  turn comes back as an unfinished run like any other, and the answer reaches
  the chat it was asked from.
- **A run survives a restart.** If Skales is closed, updated or crashes while
  a chat, a Code session or a goal is working, the run is no longer thrown
  away. It comes back in the conversation as an unfinished run, says how far
  it got, and one Continue picks it up at that step. Nothing already done is
  repeated. Under Autonomous an interrupted run picks itself up on the next
  start and writes a line saying it did. An approval you never answered
  because the app closed comes back with the run.
- **Sub-agents that come back.** Skales can hand part of an answer to
  sub-agents and wait for them: ask it to check four files or four sources
  and it runs four workers at once, each with its own context and budget, and
  returns with the conclusions. A sub-agent can work in its own checkout of
  your repository, so two of them never touch the same tree, and what they
  changed arrives in your folder as normal pending changes, hunk by hunk.
  Sub-agents cannot start sub-agents.
- **Budgets and a context meter.** A run can be held to a token budget and a
  spending limit, not just a number of steps, and says which one it reached.
  A running goal shows how full the model's context is, how many steps and
  tokens it used and what it cost so far; where a cost cannot be worked out,
  the total says it is incomplete. Every chat now carries the same reading
  under the composer, measured on what the last answer actually sent, and it
  names what filled the window: the system prompt, the tool definitions, your
  skills, your memory and the conversation itself. Type /compact in the chat or the Code
  window to shorten a long conversation on the spot. Long runs on Claude
  models reuse the conversation from the previous step instead of paying for
  the whole transcript again. A run that cannot shorten its own conversation
  stops and says so, instead of ending on a provider error that explains
  nothing.
- **One job store, one clock.** Planner tasks, goal schedules and cron jobs
  were three schedulers with three stores and three failure rules. They are
  one now. Workflows, playbooks, team runs and goals can be scheduled on the
  same form, the Playbook "Scheduled" badge is true, and a job can be fired
  by a watched folder or a watched mailbox instead of the clock. Watched
  mailboxes read each message once, even across restarts. Plugins that
  declare a folder or mailbox trigger are armed and stopped with the plugin.
- **Discord answers, webhooks become tasks.** The Discord bot starts with the
  app, reaches the same engine your chats do, and an action that needs your
  yes appears as Approve and Deny buttons in the channel. A webhook arrives
  on the Tasks page with its own log under the same confirmation rules. The
  dashboard no longer says a bot is running when its messages go nowhere.
- **One approval, every channel.** A request to approve an action is a single
  record that Telegram, WhatsApp, Discord and the app all decide; answer it
  once and it is gone everywhere. WhatsApp can approve now, as a numbered
  question. A run that needs approval on a channel that cannot ask says so
  straight away, and an approval that runs out of time says so in the chat.
- **A System button in the sidebar foot.** Between Settings and Stop, it
  opens Update, Report Bug, Logs and diagnostics, the Guide and the DevKit as
  links; Logs, Update and Report Bug left the menu for it. Crashes and failed
  calls moved from Settings to the Logs page, beside the log they describe;
  Settings keeps a signpost. Cmd+K finds every page, including the ones
  without a menu row. One autonomy switch with one name: Autonomous, with its
  time window; the Goals section that was called Autonomy is Working style.
  The sidebar itself is as it was in 12.9.21: Home and Chat, Dashboard on top.

### Fixed

- **The Zotero preset carries its key.** The llm-for-zotero server protects
  its endpoint with a bearer token, and the preset from 12.9.21 claimed no key
  was needed, so the connection failed at the first call. The quick setup now
  reads the token off your Zotero profile and fills the Authorization header;
  where it cannot, the field is on screen with the path to the token.
- **Text a tool fetched can no longer imitate you.** Everything Skales reads
  from somewhere else - a web page, a mail, a file, an entry from a connected
  service - is handed to the model inside a marked-off block, so it is treated
  as material to report on rather than as an instruction. That block is now
  cleaned before it is handed over. Characters that render as nothing but still
  read as text to a model are taken out, so a page can no longer hide a
  sentence in the gaps between the words you can see. Text laid out to look
  like the conversation resuming - a blank line and then "assistant:", or a
  fragment of transcript markup - is defused, so a page cannot put words in
  Skales' mouth or invent a turn that never happened. And a page carrying a
  copy of the marker itself can no longer close its own block early and have
  the rest of it read as instructions. Ordinary writing is untouched: a
  sentence about a system, a heading with a colon in it, and a config file full
  of angle brackets all arrive exactly as they were written.

- **Every part of Skales gets that protection, not just the chat.** The marked
  block used to be put on where each conversation type built its own messages,
  which meant a scheduled task, a background agent, a remote session or a run
  resumed after a confirmation could reach the model without one. It is now
  applied at the single point every request passes through, so chat, Buddy,
  Telegram, WhatsApp, agents and scheduled runs all get the same treatment. A
  block that had lost its ending - which a long, compacted conversation could
  cause - is repaired rather than passed on, so the rest of a conversation can
  never be swallowed into it.

- **The clock stopped costing you money every minute.** Skales tells the model
  what time it is, and that line used to carry the minute. Every time the minute
  rolled over, the provider's cache went cold and the whole conversation was
  charged at full price again - on every step of a long run. The line now says
  the date and the hour, which is all it was ever read for, so a turn that has
  not changed anything reads the same bytes as the one before it. Reminders and
  scheduling are unaffected: they are computed from the real clock, and the
  times you see in the app are exact as they always were.

- **A small model that circles is asked for the answer instead of left to
  spin.** Asked for its name and what it can do, a small local model would go
  round and round: what can I do, which skills are ready, what is in the
  workspace, what can I do again. Nothing caught it, because it never repeated
  itself - a different read-only tool every round. Skales now watches whether a
  round brought anything NEW, and after four that did not, it takes the tools
  away for one round and asks for the answer from what is already on the table.
  A run that is genuinely working is untouched, however long it runs. Asked who
  it is or what it can do, Skales answers from what it already knows: its name
  and its capability list are in front of it and were never something to look
  up. Reported on a 0.8B model on Linux, where the same question took twenty-two
  minutes and eighteen tool calls.
- **A conversation is never named after a tool call.** A model whose server does
  not parse function calls writes them out as text, and a chat in History ended
  up called `search_web text: "sk..."`. The naming pass now skips the machinery
  and looks for the first real answer, and a name that is itself a tool call is
  refused outright, in History and in the chat window alike.
- **A local model's own context window is what the request is measured
  against.** The safety trim that keeps a request inside the window was
  measuring against a guessed default rather than the window the local server
  reported, and against the chat model rather than the one actually answering
  when a different model had been chosen for code.


- **The chat stays still while an image turn is regenerated.** Regenerating a
  turn that carried a picture put the "n/n" version switcher under the new
  answer in and out of the bubble on every poll, and a transcript pinned to the
  bottom stepped up and down with it for as long as the model worked. The
  archive of earlier answers now goes onto the rebuilt list before it is
  shown, so the switcher stays where it is from the first token.
- **Ollama takes a picture again with keep_alive set to "keep loaded".** The
  "-1" and "0" presets went over the wire as text, which Ollama's native
  endpoint reads as a duration and refuses with "time: missing unit in
  duration". They are sent as numbers now; the chat endpoint had quietly
  ignored the field, which is why only image turns failed.
- **A batch skill import lists the repository once.** It used to ask GitHub
  for every folder of every skill, and sixty unauthenticated calls an hour ran
  out halfway through a skills repository, so the second half arrived without
  its scripts. One call now fetches the whole tree, the files come from the raw
  host that has no such limit, and the import page lists every error by skill
  and reason instead of saying "1 error".

### Removed

- The Codework and Swarm pages, the parked Business, Cast, Datasets and
  Network pages, and a Studio publish route nothing called. Codework has been
  a mode inside Skales Code for a while and Swarm is the /swarm chat command.
  A build check now makes sure every page is either in the menu or declared
  doorless with the reason written down.
- The AIPointer overlay can start apps again instead of answering that the
  feature is not built yet.

## v12.9.21 - Cockpit 2.0

### Added

- **Cockpit 2.0.** One head, one action. The Cockpit opens on an execution
  board: everything that stands, in four columns - pending, in progress,
  completed, blocked - with goals, your own tasks, Autopilot tasks and
  schedules as cards you can filter, drag and act on. Goals, Schedule and
  Tasks sit below as sections that fold open; Live and History are one switch
  away; Identity & Memory and the Control Room keep their place as sections.
  The two stacked tab bars, the second title and the icon chips are gone, and
  finished goals finally show up as finished.
- **Every model gets a "Can this model see images?" switch.** Beside the model
  field of each provider card: Auto, Yes, or No. Skales used to guess from the
  model name and from what a running daemon reported, and there was no way to
  correct a wrong guess except for custom endpoints. Your answer now wins over
  both, in either direction, for that model at that provider. GLM-5 and Qwen 3.5
  are recognised as able to read images by rule rather than by an exact name.
- **Answers cite the memories they used.** A line under the reply lists what
  Skales recalled, each with its date, and tapping one jumps to that entry on
  the Memory page. The Buddy shows the same line from the same recall.
- **Agent lessons have a home.** What an agent learned from its runs shows on
  the Memory page as its own kind, correctable and deletable per line.
- **Skales Code adopts what a project already has.** Rules written for other
  editors are named, MCP servers from a project made elsewhere can be imported
  (switched off, with their command line shown), and files a project tracks on
  purpose under an ignored folder stay visible in the tree.

### Changed

- **The card that asks how you like to work asks each question once.** Answer
  it or wave it off and it is gone for good, in the feed and on the Memory page.
  Every question is answered by tapping - no open text box, no model call - and
  there are six more of them to draw from. Answering shows what was saved and
  then clears the card away.
- **Plugin pages are the page.** The job box only shows for plugins that have no
  page of their own; a page plugin gets a small "Give a job" in its header
  instead of a permanent box above the tool. Something a run prepared and parked
  now waits where the thing is - on the page, next to the letter or invoice -
  and the frame sits flush in the window with one scrollbar instead of two.
- **Bundled plugins open on what they are for and what to do first**, instead of
  on a row of counters reading zero. Data Broker Exit offers the step you can
  actually take - fetch the register, record your details, pick the companies,
  then check for answers. Open Invoices no longer tells a fresh install that
  every invoice is paid. Notice Radar, Page Watch and Receipt Inbox name the
  first step, and a button that cannot do anything yet says why. Installed
  copies show "Update to 1.1.0" on the plugin page.
- **Bundled plugins update themselves when nothing about their rights changes.**
  A newer bundled version that asks for no new tool, network or file access is
  applied on the next start or page visit; one that widens its rights still
  waits for your approval card.
- **A room with nobody else in it says "sent", not "sending" forever.** The
  message was delivered to the relay; there was simply nobody to confirm it.
- **The DevKit command line is `skales-dev`.** The app's own `skales` command
  keeps its name; the docs say which is which.
- **Removing someone from a room now tells the relay.** The removed device stops
  receiving that room's pushes at once instead of when it next says so itself.
- **Advisor strategy answers plain chat on the executor.** The advisor only
  steps in for a turn that really needs a plan; a normal message no longer
  routes to the planning model.
- **Every turn carries less prompt.** The release notes and the page catalogue
  ship as short lists and the full detail loads on demand; facts told twice
  are told once; the stable part of the prompt stays ahead of the cache line.
  A model that was handed the whole tool catalogue because it once fumbled a
  call gets the short one back after its first real tool call.
- **Plugin cards say how a plugin reaches the web.** "Sandbox offline, reaches
  the web through Skales tools" instead of a bare "No network" on a plugin that
  sends mail or fetches pages through the host.
- The plan header says "Step 2 of 5" instead of "2/5".

### Fixed

- **A note sent to your phone has a place to land.** `send_to_phone` delivered
  the note and the push arrived, but tapping it opened nothing, because the
  phone had no destination for it. The note now lands in the open conversation
  on the phone under "From your computer", the tool description, the docs and
  the app's own self-knowledge say so, and the guide has a section on it.
- **Image generation on OpenAI and OpenRouter works again.** The OpenAI path
  sent a `response_format` parameter that the gpt-image models reject, and a
  size they do not offer; both now follow the model family. Image-only
  OpenRouter models were called on the chat endpoint and answered 404; they now
  go to the images endpoint, hybrid models stay on chat, and a model that fits
  neither gets a sentence instead of a status code. The image-model picker in
  Settings lists both catalogues.
- **A custom endpoint is no longer treated as a local model just for being
  custom.** The address decides, and every custom endpoint card carries a
  "Runs locally" switch for the cases the address cannot tell. A hosted
  frontier model behind your own URL gets the full tool set, not the 70-tool
  cap meant for small local models.
- **Importing skills from GitHub brings the whole skill folder.** The batch
  import used to write only the SKILL.md and drop the scripts beside it; single
  and batch import now go through one installer that mirrors scripts,
  references and assets.
- **Zotero is a one-tap MCP preset.** The quick setup lists the llm-for-zotero
  server, so a library can be connected without typing the command by hand.
- **Small local models that print their reasoning as the answer no longer do
  so.** Thinking that arrives without any tag folds into the reasoning panel,
  while it streams and once it lands; when Skales is not sure, it shows
  everything rather than hiding a real answer.
- **The chat no longer steps up and down while the assistant works.** The
  status line stayed put once per run instead of remounting on every poll, and
  the auto-follow only scrolls when there is more to see.
- **An attached picture tells the truth about who sees it.** The note under an
  image no longer claims the model can already see it when the model is blind
  or when a separate vision model is doing the looking. "This model cannot read
  images" names both ways out - the switch and a vision provider - where it
  happens.
- **Quitting Skales sweeps up llama-server processes** left behind by an
  earlier session or a crash, not only in the emergency backstop. Restarting
  from inside the app now shuts down everything a normal quit shuts down.
- **A scheduled agent that finishes with nothing to say is marked failed** and
  says why, instead of being filed as a successful run.
- **Installing the TypeScript checker for Skales Code works again**: the install
  pinned no compiler version and the newest one has no tsserver, so every
  request came back "unresponsive".
- **The build gates no longer go blind** on a file whose line comment mentions
  a path with a star in it.
- **A Windows update that cannot install now says so.** The installer used to
  run hidden, so anything that stopped it - Windows warning about an unsigned
  setup, or one last Skales window still holding a file - ended the update in
  silence, and the next start was the old version again. It now installs in its
  own window: the warning and the "close Skales and retry" prompt are on screen
  where they can be answered - and because the setup now knows it is an update
  of an app that is closing itself, it waits for that instead of asking at all.
  Skales still restarts by itself afterwards.

## v12.9.20 - Slim

### Added

- **Your agent carries its working mood in the open now.** The Conscious bar
  and the companion behind it - interests, mood, the day's movements - are on
  from the start instead of hidden behind a switch most people never found.
  It only ever draws: no notification, no sound, nothing sent. One tap in
  Settings > Memory turns it off, and anyone who had turned it off stays off.
- **A pixel gecko lives on the Code landing.** Between the greeting and the
  composer, 120 by 80 pixels of mascot, with nine little loops - it naps,
  hunts a bug out of a terminal, sheds its skin, catches a fly. Every visit
  picks a different one, never the same twice in a row, and its dark details
  follow your theme.

- **Call Mode is Iris now.** A call used to run on a second, smaller brain in a
  conversation of its own: no skills, no goals, no access limit, and its answers
  landed somewhere you were not looking. It is the same mind as the voice window
  now, in the same conversation, with everything that mind can do - and if it
  needs permission for something it asks out loud and takes "yes" or "no" for an
  answer. Hang up and the chat behind it is where you left it.

- **A result in the ring can be a circle now.** Short answers, a picture, a
  short list and the countdown get a round frame with the text following the
  curve; anything longer, and anything with headings, lists, tables or code,
  keeps the panel it has always had. Long text scrolls by itself, slowly enough
  to read along with - and the moment you touch it, with wheel, trackpad,
  scrollbar, keyboard or by selecting a word, it stops for good.

- **A web page can live inside the ring.** Ask to see a page and it appears in
  the frame as the page, with its pictures, rather than as a wall of text - and
  the browser only opens when you actually ask for the browser. More of what
  Iris finds now has somewhere to be shown: what you searched, what you listed,
  what you read.

- **You can watch a design being made.** Studio, the chat and Flow now show a
  running line while a visual is being written - which stage it is at, how much
  has arrived, how long it has been going. Before this you looked at nothing at
  all for as long as it took, with no way to tell a slow model from a stuck one.

- **A design that got cut off says so, and Skales finishes it.** When a model
  runs out of room mid-page, the half that arrived used to look exactly like a
  finished one - and the next thing you did was share it. Now it is labelled,
  Skales writes the rest once by itself without asking, and if that is still not
  enough there is a button to carry on. It stops on its own when a model starts
  going in circles instead of burning your budget on it.


- **Skales remembers what yesterday was about.** Once a conversation has been
  quiet for a while, it writes four short lines about it: what it was about,
  what got settled, what was still open, and which of your things came up. The
  conversations of one day are folded into a single account overnight, so
  "last week" has an answer too without anything having to read eight hundred
  messages again. Opening a new chat brings the open ends of the last one with
  it, quietly, instead of asking you to explain it all a second time.

- **"What did we talk about yesterday?" is a question that works now.** The
  search through past conversations understands periods of time, and it looks
  for meaning rather than for letters - so it still finds the afternoon you
  mean when the words you used back then were different ones. Alongside it
  there is the cheap way: the short account of a conversation, instead of the
  whole conversation.

- **You can see where a saved line came from.** Every line on the Memory page
  now says whether you told Skales yourself, whether it was noted during a
  chat, whether the nightly pass found it, or whether it came over from your
  phone. A line from before this existed says nothing rather than guessing.

- **A saved line can be corrected, not only deleted.** A memory that is right
  about the subject and wrong about the detail used to cost the whole record.

- **Skales brings along what hangs off the thing you are talking about.** Until
  now it could only look something up when the word was there. Mention a
  project, and the people and tools that belong to it come with it, without
  having to be named.

- **What you keep coming back to now shapes an ordinary conversation.** It was
  learned already, and it reached the messages Skales sends on its own, but not
  the chat in front of you. It says what you care about, which is a different
  thing from where a conversation stopped, and both are used quietly rather
  than read back to you.

- **Ten plugins ship with Skales, and they are the point rather than the
  demonstration.** The shelf used to carry two, and neither answered the
  question of what a plugin is for. It now carries three that answer a question
  about your own exposure, three a small business runs on, and four about the
  working day. **Exposure Check** tells you whether a password has been in a
  breach without the password leaving the machine: it is fingerprinted here and
  five characters of that fingerprint go out, and the same page names which of
  the services you use have been breached and exactly what came out of each.
  **Attachment Check** answers for a file somebody mailed you in two steps -
  first a lookup by fingerprint, which publishes nothing, and only then, if you
  press it, an upload that does. It follows a link without opening one, and
  shows you where it actually ends up. **Data Broker Exit** works down the
  Californian broker register, writes each company the erasure request the law
  where you live actually gives you, tracks the deadline it has to answer by,
  and chases the ones that go quiet. **Open Invoices** keeps who still owes you
  money and has the reminder written by the time it is overdue. **Notice Radar**
  keeps every contract with its notice period and warns you long before the day
  you can still cancel. **Receipt Inbox** collects the receipts that arrive by
  mail into a month you can correct and hand on. **Page Watch** tells you what
  changed on a competitor's page since last week. **Meeting Prep** reads
  tomorrow's calendar and leaves a briefing on whoever you are meeting.

- **Nothing any of them can do happens quietly.** Every one sends only behind a
  card that names the recipient and the text and waits for you to press it, on
  any machine, in any mode, and a run on a schedule has nobody at the screen so
  it prepares the thing and the sending waits. Each reaches its own folder and
  the tools written on its card, and nothing else. Every one of them says on the
  page what it still needs - a mailbox, a calendar, a key - instead of showing a
  blank panel, and the parts that are arithmetic keep working while it says so.

- **Skales Code answers to the keyboard now.** A command palette on Cmd-K (or
  Cmd-Shift-P) lists everything the window can do and says which key does it.
  Cmd-P jumps to a file by name, Cmd-Shift-F searches the project, Cmd-B the
  file column, Cmd-J the terminal, Cmd-Shift-G the review panel, Cmd-N a new
  session, Cmd-Shift-H the history, Cmd-comma the settings, Cmd-period stops a
  run, and Cmd-slash lists all of them. Inside the terminal none of them fire:
  Control-P and Control-K belong to your shell, and a window that swallows them
  has broken the terminal it gave you.

- **Search the project, not just its file names.** The file column has a third
  side that searches file CONTENTS - the same fast search the assistant has
  always had for itself - with a switch for case, one for regular expressions,
  and a field to narrow it to certain files. Every hit is a place: click it and
  the file opens at that line. A pattern that cannot work says which character
  is wrong and where, and a result list that had to stop early says how many
  matches there were in total instead of quietly looking complete.

- **Take a diff apart instead of taking all of it.** Every part of a change now
  has its own checkbox, so two good edits and one wrong one in the same file no
  longer force you to throw away all three. Keep the parts you picked, undo the
  parts you picked, and take a file back out of the next commit. If git can only
  place some of the parts, it says which one it could not and why.

- **The repository, inside the window.** Branches list, switch and get created
  here; fetch, pull and push are buttons; the working tree can be put aside and
  brought back; and the commits that already exist are readable without leaving
  for a terminal. A switch that would overwrite uncommitted work names the files
  and stops instead of stashing them behind your back, and a push that moved
  nothing says so rather than reporting success.

- **`skales .` opens a folder in Skales Code.** The terminal command can be set
  up from the Code window's settings, and if the system will not let Skales
  write there, it hands you the exact command to run yourself instead of failing
  quietly. A folder can also be dropped on the app or opened from its own
  right-click menu. A folder that already has a session opens that session.
  The DevKit's own command, which used to answer to `skales` as well, is now
  `skales-dev` - one talks to an app that is already running, the other opens a
  folder and can start one, and both can sit on your PATH at the same time.

- **Rules you wrote for another editor come with you.** A project's
  `.cursorrules`, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md` and
  `.windsurfrules` are read alongside its `CLAUDE.md` or `AGENTS.md`, and a
  project that has only those still gets them. The project's own file is still
  read first and still wins; every block says which file it came from, so a rule
  that has gone stale can be traced to the thing to delete.

- **Mistakes show up in the same turn they were made.** After a file is written
  or edited, the language checker for that language reports the errors it found
  straight back, without a build and without a test run. Skales does not put a
  checker on your machine on its own: it asks, the card says exactly what would
  be run and where it lands, and saying no leaves everything else working. A
  checker that has not answered yet is reported as "not checked yet", never as
  "no errors".

- **One objective, several branches, one comparison.** A job can be handed to
  several variants at once, each in its own checkout on its own branch, each
  with its own approach if you give them one. The comparison leads with the
  files more than one variant touched, because that is where the attempts
  genuinely disagree; the rest is each variant's own work and can be taken as
  it stands. A winner can be kept as a branch, merged, or turned into a pull
  request, and clearing up never deletes a variant's transcript.

- **Browser, Playbooks and Workflow are back - as popups.** All three open
  from the chat column's More without leaving the conversation, the browser
  also from the Code window. A playbook records and replays inside the popup
  instead of walking you away to another page. Projects got a proper menu
  entry the same way.

- **Building a plugin works end to end.** The assistant now always knows its
  own plugin tools, so "build me a page" builds one instead of ending in
  guesswork. A plugin can no longer be created with an empty page, its page
  follows the active theme, any tool the page calls without being granted is
  named out loud, and nothing a plugin is not allowed to have is dropped
  silently any more - what was granted and what was refused is spelled out.
  The page editor refuses to save a page down to nothing.

- **Your Skales Wrapped asks once a week, in the same card.** When a fresh recap
  is ready and you have not shared it yet, it is one of the lines in the
  composer. Choosing it opens the recap itself - no waiting, no generated text
  in between - and once you have shared it the line is gone for that week, even
  across a restart.

- **The feed finally shows the work it never showed.** Teams rooms, plugins you
  build and use, projects, Hugging Face Spaces, custom widgets, result cards,
  Flow films and shared agent skills all have their own wording now. Every one
  of them says THAT something happened and never what: never a room name, never
  a project, never a message, never a search you ran.

### Changed

- **Vision & Screenshots is the switch it always said it was.** The add-on
  promised to cover images and only ever governed the screenshot tool: turned
  off, a second vision model still read every picture you attached. It now
  covers all three - desktop screenshots, analyze_image, and letting a separate
  Vision Provider read chat attachments. It stays on by default, so nothing
  changes unless you touch it. Off means no second model ever reads your
  images; your own model still sees them if it can, and if it cannot, Skales
  says so by name instead of sending blind. Browser Control and Desktop Control
  keep their own eyes either way - they have their own switches.

- **Your own model gets your picture first.** An attached image used to go to
  the Vision Provider whenever one was configured, even when the model you
  chose could see perfectly well - so a frontier model answered from an older
  vision model's description instead of the picture. Now a model that can see
  gets the image itself, and the Vision Provider steps in only when it cannot.
  The "Chat (images)" tick is still the Vision Provider's permission for chat;
  it just no longer outranks a model with eyes.

- **Teams stands with the working surfaces.** Its only door used to hang off
  the chat column, which left it with none in Home and none at all in the
  layouts that have no chat column. It is in Main now, so More reaches it like
  everything else.

- **The question about how you like to work waits where you can find it.** It
  used to arrive in the middle of a conversation, with a notice on top, at a
  moment nobody picked. It lives on the Memory page now, next to what Skales
  has already learned about you, and turns up in the Discover feed between the
  posts. It comes in two shapes - a couple of taps, or one open question - and
  only ever one at a time across both places. Older conversations that still
  hold one of these cards keep them, and they can still be answered there.

- **Teams is a room, and only a room.** The six-digit pairing that reached
  exactly one other computer is gone; a room code and its QR are the one way
  in, for phones and desktops alike. Every pairwise conversation you already
  had is carried over into a room of its own, so no line is lost. The screen
  that used to hold two features at once now holds one: rooms on the left, the
  room on the right. Members, the board, inviting, joining and verifying open
  as panels over it instead of pushing the conversation down the page.

- **The room reads like the chat, because it is the chat.** Same bubbles, same
  four bubble fonts and sizes, same markdown, same colours in all three themes.
  You can attach files - drag them onto the composer or use the paperclip -
  and pictures arrive with a preview the sender made, so nothing waits on a
  grey box. A file that breaks in transit says which way it broke.

- **Mention an agent and it knows where it is.** An agent in a room now reads
  the room: who is in it, who just asked, that several people are reading, and
  the conversation so far rather than the single line that mentioned it. It
  answers with the same tools, memory and skills it has in the chat, shows its
  thinking, its tool steps and what the turn cost, and can put rows on the
  shared board as a proposal. Approving those rows stays where it was: with
  the people, unanimously. Mentions are picked from the member list rather
  than read out of the text, so a quoted name can no longer start a paid run.

- **Nothing starts on a machine that stepped away.** If the computer or phone
  that owns an agent is not in the room, the request waits for it and runs
  when it returns, instead of failing on the spot. An agent someone else can
  start now asks its owner before anything that needs confirming.

- **A room can be cut, exported and quietened.** Press and hold a room for
  rename, notifications, verify, export, a new section and leave. A new
  section draws a line everyone sees; older messages stay readable, and agents
  read from the line onward. Each room chooses how loud it is, and starts at
  mentions only. Agent progress never rings.

- **You are told when you are not looking.** A room you are not on now raises
  a count, and a mention reaches you as a notification even when the window is
  behind something else. Knocks and a changed security key come through even
  in a muted room, because those are not messages.

- **Members say whether you have checked them.** The four-character key stub
  is gone from the member list. Each member carries verified, unverified or
  changed, and tapping one offers the QR up close or six words to read aloud.
  The stub survives only where two members share a name.

- **The sidebar belongs to you now.** Home shows four entries - Dashboard,
  Chat, Code and Studio - and one More button that holds everything else,
  grouped the way the old headings did. Pin what matters (the pin on the row,
  or a right-click) and it rises out of More to sit under the four; unpin and
  it returns. Pins survive a restart, and a fresh install starts with the
  plain four. Notification dots travel with an entry wherever it lives, and
  while something with news is tucked away in More, the More button itself
  carries the dot. The chat column pins the same way, under Cockpit.

- **The Code window's file tree is loaded a level at a time.** Opening a folder
  reads that folder, so a repository of any size costs one read per level you
  actually look at rather than a scan of everything before the first line
  appears. Dot-files and dot-folders are visible now - `.github`, `.env.example`
  and `.eslintrc` were unreachable - and files your `.gitignore` excludes stay
  out of the tree, the way they stay out of git.

- **Custom widgets line up like everything else.** An active widget appears
  under More instead of opening its own titled block in the column, and can
  be pinned like any other entry.

- **Beta is said in one place.** The beta mark sits in a surface's own title
  now - Plugins and Teams carry it - instead of being sprinkled across menus,
  settings and screens.

- **Swarm's own page steps back.** Teams is how machines work together now
  and took over that door; swarm delegation itself keeps working for chats
  that use it.

- **The Add-ons page tells the truth.** A card whose page has no menu door
  right now says so instead of pretending, and the Lio card stepped out
  entirely - Lio lives inside Flow.

- **The Discover composer has no text box any more.** Tapping "What's on your
  mind" used to hand you an empty field and a blinking cursor. It now opens a
  card with three or four concrete lines, each one built from something you
  actually did this week - "you made four images in Studio", "you have never
  tried this" - and the second line under each says how often, or that it is
  new to you. The card is there the moment you open it: it is assembled from
  what is already on your machine, so nothing has to be asked of a model first.
  There is nowhere left to type, and that is the point - the composer was the
  shortest path in the app from something you typed to a public page.

- **The GIF is a choice, not a search box.** Picking a GIF used to send whatever
  word was in the field to Klipy or Giphy. Now a handful of GIFs come back for
  the suggestion you picked, and you choose one of those.

- **Long conversations stopped eating the app.** Streaming an answer into a
  chat with hundreds of turns used to seize the whole window for seconds at a
  time - typing lagged, frames dropped, and the longer the history, the worse
  it got. The page now draws only what you are looking at, an answer arriving
  no longer makes the rest of the conversation do work, and a chat of five
  hundred turns opens in half the time. Typing stays instant while a reply is
  coming in, and quoting, forking, editing and jumping to an old message all
  still land exactly where they did.

- **Skales is on screen sooner.** The window no longer waits for the engine to
  finish waking up before it exists, the opening screen holds only as long as
  it actually needs instead of a fixed pause, and there is less to load before
  the first page appears. On the rare start that genuinely takes long you now
  see what is happening and have a way out, instead of watching a logo.

- **The sidebar is quicker off the mark.** The first paint now does only
  first-paint work; the dots, counters and lists that merely decorate a row
  arrive a blink later instead of standing in front of it. Your pins, your
  chosen page and everything you rearranged stay exactly as they were.

### Fixed

- **A model that only ever thinks gets stopped, with the bill named.** A
  thinking model that circles in its own reasoning forever used to keep a
  visual run alive at full cost without writing a single line. Past the same
  runaway ceiling the chat already enforces, the run now ends with the spent
  amount named and a suggestion, instead of a spinner that costs money.
- **The phone's plugin card now shows a plugin's memory reach.** The desktop
  sends the memory permission along with the plugin list, so a paired phone
  shows the real setting (own memory or shared) instead of assuming the
  stricter one.
- **Google Drive can upload a real file now.** Uploading only ever worked for
  text the model typed out itself: there was no way to hand it a file that was
  already on your disk, and anything that was not plain text was quietly
  scrambled on the way up. Point it at a path instead - a photo, a PDF, an
  archive, a video - and what lands in Drive is the file, byte for byte. Big
  files no longer ride on one connection that gives up after a minute, and when
  Google refuses something it says why in a sentence instead of a number. The
  usual folder rules apply, so nothing outside them can be sent anywhere.

- **Half past five in the afternoon is the afternoon.** Open Skales at 17:30 in
  Buenos Aires and it wished you a good night. Three screens each kept their own
  idea of when the evening starts, and one of them started it an hour early - in
  Spanish and Portuguese that turns straight into the wrong greeting. There is
  one answer now, read off your own clock, and the home screen no longer flashes
  "Good morning" for a moment before it catches up.

- **A cloud video that came out shorter than you asked says so.** Every video
  model has a length it can actually make, and the ones that cannot reach your
  number quietly make something shorter - which was then filed, shown and shared
  as the clip you briefed. It now carries the same label a cut-off design does,
  in the gallery as well, and it tells you how long the clip really is and what
  to do about it.

- **Small local models stop talking themselves into circles.** A 2B-class model
  asked to transcribe an upload could wedge in its own thinking, repeating one
  phrase until you stopped it by hand. The instructions for result cards are a
  protocol those models cannot follow, and they were being handed to every
  model regardless of size - a modern 2B ships a huge context window, so the
  window alone did not tell them apart. The size the model declares is read as
  well now, and a model too small for the protocol simply never receives it.

- **You can see what an uploaded audio file said.** Dropping a clip in the chat
  transcribed it and then showed you nothing, so the natural next move was to
  ask for the same transcription a second time and pay for it twice. Clicking
  the attachment now opens exactly what Skales extracted from it - the spoken
  words for a clip, the extracted text for anything else - which is also
  precisely what the model was given.

- **Skales Local actually uses your graphics card.** The local engine was started
  without ever being told how much of a model to put on the GPU, so an
  accelerated build took video memory and then did every calculation on the
  processor: the card looked busy and sat at zero. The layers slider and the
  thread count in the model settings now reach the engine, and changing either
  restarts it so the number on screen is the number it is running with.

- **You can see what the local engine found.** A new Hardware line under the
  GPU badge names the backend it was built with, the graphics card the engine
  itself reports, the server file and version that are running, and how many of
  the model's layers actually went to the card. Before there was a download, a
  model or a running engine, it says which of the three is missing instead of
  standing empty.

- **The Spanish voice can be found by looking for Spanish.** Searching the local
  model list now matches the language and its locale as well as the name, with
  or without accents, so "espanol", the same word spelled properly, and "es-ES"
  all reach the Spanish voices. Every voice also has one name now instead of two
  different ones on two screens.

- **A voice you have not downloaded can be downloaded where you pick it.** The
  greyed-out "not downloaded" entries in the voice picker used to be a dead end;
  the ones you are missing now sit under the picker with their size and a
  download button.

- **A model that thinks for minutes is no longer mistaken for a dead one.** In
  Studio a reasoning model could think for six minutes before writing the first
  line of a design - and the card said "waiting for the first line of the page"
  the whole time and then gave up, because only visible text counted as a sign
  of life. The thinking counts now: the running line says it is thinking and how
  much thinking has arrived, and the run is only ever ended by real silence.

- **A design wrapped in chatter arrives as a design.** When a model put its page
  inside a code block with a sentence before or after it, the backticks and the
  chatter ended up in the page itself.

- **A style pack actually changes how the result looks.** The chosen pack used
  to sit near the top of the instructions, with everything more concrete after
  it - so picking one barely moved the artifact. It is now the last thing said,
  and it says plainly that it decides the palette, the type, the geometry and
  the shape of a button. The brief still decides what gets built and every word
  in it.

- **Every style pack has a description.** A third of them showed nothing, and
  twelve showed a single "|" where the sentence should have been.

- **You pick an ElevenLabs voice from a list now, instead of typing an id you
  had to go and find.** Settings > Voice shows the voices on your account -
  including the ones you cloned yourself, which were never findable anywhere -
  with a search box and a play button next to each one. The id field stays
  underneath for anyone who prefers it.

- **A voice that cannot speak says why.** A wrong voice id, an empty balance or
  a refused key used to end the same way in a call: another voice answered and
  nothing said the setting had been dropped. Now the reason appears on screen,
  in the service's own words, and the call reads through the same voice ladder
  as the rest of Skales instead of a shorter one of its own.

- **Buddy and Call Mode no longer die as a white window.** If something in
  either one breaks while drawing, you get the real reason, the details to send
  and a way back, in place of an empty pane.

- **A call no longer falls silent on anything that takes more than one step.**
  Ask a question in Call Mode that needs a tool and the answer used to never
  arrive; it does now.

- **Big models that think before they write finally get the room they need.**
  Several of the large frontier models were being handed an eighth of the space
  they can actually use when they were reached through an aggregator, so a long
  single-file answer was cut off mid-document while the model still had plenty
  left. They also got a short clock meant for fast models, which ended turns
  that were still working. Both are fixed, and the families that think silently
  for minutes are now recognised as such.

- **The dimming behind a dialog now actually dims.** In Studio's Flow tab the
  shaded layer was being painted underneath the very navigation it was meant to
  cover, so a dialog left the app looking half-open.

- **Escape no longer throws you out of Flow.** Opening a picker and pressing
  Escape closed the entire workspace instead of the picker.

- **Buttons in Flow's preview no longer sit on top of each other.** Narrow the
  chat column and Export, Share and the reload button used to overlap; they now
  give way in order and the row wraps instead of spilling.

- **The camera settings in Studio reach the video now.** Lens, lighting and mood
  could be chosen but never left the screen - the video was made as if you had
  set nothing. A render that picks up again after a restart also shows its
  progress once more instead of an empty panel.


- **The memory understands every language now.** What Skales picked up on its
  own was tied to English phrasing: "I live in Vienna" was learned, "ich wohne
  in Wien" was not. For anyone whose everyday language is not English, this
  half of the memory was quietly running empty. Two smaller faults of the same
  kind went with it: the nightly pass gave English sentences a head start that
  landed exactly on the threshold, so the same fact was kept in one language
  and thrown away in the other - and search folded away every accent, so a
  German word could not match itself.

- **What you say about yourself counts too.** The nightly pass only ever
  learned from sentences Skales had written, never from your own.

- **A fact that has been overtaken steps back instead of standing alongside.**
  Someone who moved had two homes in memory, both equally believed. The newer
  one now closes the older. Nothing is deleted: the history stays readable, so
  Skales can say what used to be true and since when something else is.

- **Skales only sounds as familiar as it can actually back up.** While nothing
  is recorded, it no longer talks as though it knows what you were last
  working on together.

- **The mood display shows what is really being carried.** The bar, the trace
  and the panel each counted the fading a second and sometimes a third time,
  and showed a paler mood than the agent itself had.

- **What comes back is the conversation you had, not a summary of the day it
  was in.** Both are kept, and on the day itself they describe the same
  afternoon. Where only one of them fits, it is now the specific one.

- **The day strip in the Conscious window is a time axis again.** It sat
  directly under the colour scale, built the same way, so the mark for an event
  read as a pointer into the colours above it. It has a beginning, a middle and
  an end of its own now, and under the movement marks there is a line saying
  what they mean: height is how big the move was, colour its direction, and the
  fading how much it still counts.

- **A file sent between a phone and a computer arrives.** The two sides took
  the checksum over different things - one over the sealed bytes, the other
  over how those bytes are written down for the journey - so every attachment
  that crossed between them was thrown away for a sum that was never wrong
  about the file. It showed up as two different faults: a named refusal on one
  side, and on the other a picture that stayed blurry with a share that had
  nothing to share, because the small preview travels with the message while
  the file itself does not.

- **A file whose pieces were missed is asked for again.** The pieces are sent
  to whoever is in the room at that moment, so a machine that was away misses
  them for good. It used to ask for them back exactly once, at the moment the
  file was announced - and if that moment fell on a restart, the request was
  lost too and the file sat at nothing forever. Every pass now asks again for
  what is still missing.

- **A right-click in the sidebar offers what the row can do.** A row that
  cannot be pinned had no menu of its own and handed the click to the window,
  which offered to copy this machine's address or open it in a browser. Every
  row now offers open, pin or unpin where that applies, report a bug and
  settings.

- **A shortener collapsed into one step.** Following a redirect is the one place
  the app sees a chain: it walks the hops by hand so it can check each one
  against the address guard, and then handed back only the last answer. So a
  plugin asking where a mailed link actually ENDS UP was told it went straight
  there. The chain comes back now, in order, including the hop that was refused
  when one is - which is the chain most worth reading - and Attachment Check
  lists every step instead of apologising for the ones it could not see.

- **Three doors were held shut on plugins by numbers meant for a model.** A
  tool answers a model inside a context window, so it trims: a file's text goes
  in the message rather than the result, a web response is cut at 4000
  characters, a mail body at 500. A plugin page has none of that - it asked for
  the bytes in order to parse them, and a JSON answer cut in half is not JSON.
  All three now have a ceiling of their own for pages, stated in one named place
  each, and the model's budgets are untouched. In practice: a plugin can read a
  register that answers in hundreds of kilobytes, a full scan report instead of
  its first paragraph, and enough of an invoice mail to find the amount in it.

- **A plugin could write a file and never read it back.** Reading a file
  answered a plugin's page with the file's size and its line count and not its
  text, so anything that kept a list, a ledger or a set of notes could save it
  and then find nothing there. The page gets the text now, which is what makes
  a plugin whose screen and whose scheduled half share the same file possible at
  all. The Daily Brief was the visible half of it: the page listed the briefs it
  had written and drew every one of them empty.

- **Changing a shipped plugin, then updating it, lost the change in silence.**
  A plugin from the catalogue can be edited here - asking the chat to reword its
  page is a reasonable thing to want - and the next version its author published
  replaced that page with no mention of what it was replacing. An edit made on
  this machine is now recorded, and the update card says in plain words that
  updating takes it back, before the button is pressed.

- **A plugin's memory namespace looked like a wall and was not one.** The
  manifest had carried one since the first version and it scoped nothing: any
  plugin allowed a memory tool wrote into the same store the chat uses, and one
  allowed to search read all of it - everything you have ever asked Skales to
  remember. Memory is a permission now, like the network and the files. A plugin
  keeps its notes in a store of its own that nothing else reads; reaching the
  memory you share with the chat is a separate thing it has to ask for, written
  on the card in those words before you install it. A manifest that says nothing
  keeps to its own, so nothing already installed silently kept the wider reach.
  Two of the ten ask for it, because reading what you told Skales to remember is
  what they are for: the Daily Brief and Meeting Prep.

- **The catalogue sat on top of your own plugins.** Get plugins was the first
  thing on the page, above the box for starting one and above everything you had
  installed, which made a shelf read as an advertisement. What you have comes
  first now, and the catalogue is underneath it with a line saying what it is.

- **The file list said "project" and showed you 500 files of it.** On this
  repository that was 500 of 8,188, with nothing on screen to say so. The tree
  has no cap at all now, and the flat list behind the at-mentions says how many
  files it is showing out of how many there are whenever it has to stop short.

- **The file tree took its colours from the wrong place.** It painted itself in
  the main app's colours while sitting inside a window that runs its own light
  and dark, so with the two set differently the file names could come out
  unreadable. Two hard-coded colours went with it.

- **Replies and posts died without a word.** A reply simply never appeared, and
  nothing said why. The cause was a budget: a one-shot request was capped so
  low that a model which thinks first spent all of it thinking and handed back
  an empty answer - no error, nothing to see. Nine other places in the app made
  the same request the same way. They all have room now, they climb to a bigger
  budget when the first one runs out, and if the answer is still empty you get
  the reason on screen instead of a blank sheet.

- **An Anthropic key was reported broken while it worked perfectly.** One layer
  below, every single request to Anthropic was pinned to sixty-four tokens no
  matter what had been asked for. Four things were broken by that one number
  and are fixed with it: Test Connection called a working key faulty as soon as
  a thinking model was selected, automatic chat titles came back as half a
  sentence, the memory extraction could never finish its answer, and the spoken
  greeting in Voice was cut off mid-word out loud. Google's models were sent no
  output limit at all.

- **The reasoning kill switch never reached ChatGPT.** When an answer comes back
  empty twice, Skales turns the model's thinking down and tries again. On a
  ChatGPT subscription that instruction was dropped on the way to the wire, so
  the rescue attempt went out exactly as the request that had just failed.

- **Three kinds of post were being thrown away in silence.** Flow films and
  shared or forked agent skills were sent and refused, every time, with nothing
  said. Sharing a template had the same fault one level deeper: it arrived, but
  without the part the Fork button needs - so forking a shared template has
  never once worked. It works from now on; templates shared before this cannot
  be repaired, because the data was never stored.

- **The Discover inbox was empty for everyone, always.** It asked a route that
  answers something else, and read a field that route never sends. Marking a
  message as read went to an address that does not exist. It now reads the same
  notification file the rest of the app has been reading successfully all
  along, and a message read in Discover is read everywhere.

- **The bell counted messages it cannot show.** The number over the bell
  included kinds of message the panel has no way to display, so a dot could
  never be cleared.

- **A GIF attached itself to every second post.** The composer was adding one on
  its own, half the time, and taking the search word for it out of the text the
  model had just written - straight to someone else's server, unfiltered.

- **The bots were told to be rude.** The instruction the feed bots answer under
  asked them to "tease the take" and allowed a "friendly roast", and their mood
  was re-rolled from scratch every few hours. The tips they hand out were three
  releases out of date; they are current again, and a test now holds them to
  it - every command they name has to exist, and every secret in the app has to
  be mentioned by at least one of them.

- **Writing a memory told the feed you had completed tasks.** When the agent
  wrote to or cleared something in the knowledge graph, the feed announced
  finished tasks - a sentence about something that never happened. It now says
  the graph was updated, and it says that for both cases: it never reveals that
  something was removed.

- **Skales Wrapped left up to seven files behind for one week.** The recap
  archive named its file after the start of the seven-day window, and that
  start moves every day - so a week that was looked at on seven days was
  recorded as seven weeks. The recap itself still covers the last seven days,
  which is deliberate: a calendar week would show you its emptiest state on
  Monday morning.

- **The shake on the Desktop Buddy did nothing, and the secret counter promised
  one more than existed.** Grabbing the gecko and shaking it back and forth now
  gets you its reaction in its own bubble, once per shake rather than a stutter
  of them, and the "secrets found" counter counts against the secrets that
  actually exist, so the badge can be finished.

- **Your Skales Wrapped is offered on the day it is freshest.** The recap covers
  your last seven days, but the line that offers it in the composer counted from
  Monday morning - so on a Monday it saw almost nothing and stayed away, exactly
  when the recap had the most to show. Both now mean the same seven days.
  Whether you have already shared it is still remembered per week, so the line
  goes away once you post it and comes back with the next one.

- **Privacy Mode keeps its whole promise.** Two pieces of local context could
  still ride along with a request while Privacy Mode was on. Nothing does now.

- **The opening screen no longer talks over itself.** An error or a first-run
  message shown during startup used to be replaced by generic filler a couple
  of seconds later - the colour stayed, the reason vanished. What it says now
  stands until the story actually changes.

- **The file rules follow you to the phone.** Tightening which folders Skales
  may read used to bind the desktop only; the paired phone kept reading through
  the old door. Every remote file road now asks the same rulebook as the
  desktop, and a refusal says so instead of returning an empty list.

- **A fetched page says where it really came from.** Reading or extracting a
  web page used to follow redirects silently, so a shortener or a tracking
  gateway looked like the address you asked for. All three web tools now name
  the chain they followed.

- **Escape in Flow's export menu closes the menu.** It used to close the whole
  workspace, taking your place in the work with it.

- **A design that was cut off says so in the gallery too.** Studio used to file
  an aborted page without its label, so after a restart it read as finished.
  The label now travels with the save, and the gallery shows it on the tile.

- **Cmd-K works from the very first moment.** Pressing it in the first second
  after a page opened used to do nothing at all; the press is now caught up the
  instant the palette is ready.

- **The character question shows that it is thinking.** Every third one is
  written fresh by the model, and the Memory page used to stand silent while
  that happened.

- **Answers start sooner.** Skales kept opening a fresh connection to your
  model provider for every single turn; the line now stays open across a
  conversation, which removes a handshake's worth of waiting from each reply.

### Removed

- **Nothing waits for your approval any more.** The queue that collected posts
  your AI wanted to share is gone: no banner over the feed, no "N pending", and
  no auto-post switch anywhere. Drafts that were still waiting are dropped on
  the first start rather than posted late - a post that has been sitting for a
  week is not news, and it is not something to be published on your behalf
  after the fact. Posts you already published are untouched.

## v12.9.15

### Fixed

- **Reading one mail costs one mail.** Asking for a single message used to load
  the entire mailbox into memory first and cut afterwards - on a full mailbox
  that ended the server with an out-of-memory crash before any mail came back.
  The list is now fetched by id, cut to what was asked for, and only then are
  those messages read; replying fetches exactly the one message it answers.
  The whole mail run also lives under one honest deadline now, instead of a
  timeout that only guarded the login.

- **Quitting tears everything down, updating included.** Updating out of the
  Linux AppImage could leave the old Skales and its local model server running
  invisibly - one of them for an hour of CPU. Every shutdown step now has a
  deadline behind it, a stuck step is named and skipped instead of waited on
  forever, and stray local model servers from earlier runs are found by their
  own binary path and stopped - at startup and at quit.

- **A local model's real context window is the one Skales uses.** A model
  running with an 8k window was treated as 32k: the history ceiling, the
  context meter and the settings all guessed. All of them now read the same
  resolved number - your own override first, then what the running server
  reports, then the catalogue - and a conversation that no longer fits names
  its way out instead of failing with the server's raw sentence.

- **Small local models are no longer taught a protocol they cannot follow.**
  The results-channel instructions that power rich cards sent tiny on-device
  models into repeating themselves until stopped by hand. A model too small
  for the protocol simply does not receive it any more; capable models keep
  rich cards exactly as before.

- **The Google account card tells the truth under failure.** A token refresh
  that Google refused used to look like the account had vanished; a status
  read that failed drew a connected account as unconnected. Both now name
  what actually happened - including Google's own reason - and point at the
  card that fixes it.

- **The model picker names the provider.** A model in favourites, recents or
  search now says which provider it belongs to, so two models with the same
  name are two different lines.

- **The incoming webhook is documented.** It existed and was findable by
  nobody: the guide, the capability list and the app's own self-knowledge now
  name it, where it lives and that it listens on the server port.

- **A dropped connection no longer restarts Skales.** A browser tab that goes
  away, a network that blinks, a helper that hangs up mid-answer: any of these
  could take the whole local server down and, with it, every answer being
  written, every scheduled task and every background job - on one machine a
  hundred times in a day. A connection ending is now treated as the ordinary
  event it is. It is still written into the crash report so it stays visible,
  and a real fault still stops the server the way it always did.

- **Read-aloud follows the language of the text, not the language of the
  interface.** A Spanish interface reading an English answer used to hand the
  line to the Spanish voice. The language is now taken from what is actually
  being read, and a voice you picked yourself always speaks - even when the
  text is in another language, because that was your choice and not an
  accident.
- **The voice settings and the Skales Local matrix can no longer contradict
  each other.** Picking a voice on one screen and then touching a switch on
  the other used to bring the replaced voice back. Both screens now write
  through the same wire.
- **The licence links next to a model say where they go.** The link labelled
  "model page" pointed at the licence text itself. There are now two links
  with two labels, and where a voice has no model page of its own, there is no
  link instead of a wrong one. Four voices were also listed under the wrong
  licence in the download catalogue - among them two whose licence requires
  attribution, which the card had dropped.
- **The built-in documentation search no longer reports a find when a single
  word of the question happens to appear somewhere in the manual.** A question
  about the world now gets told that it does not belong in the documentation,
  and Skales searches the web for it instead of looking up the same passage
  over and over.

### Added

- **A female Spanish voice on the device.** Sharvard joins the on-device
  voices, downloadable from the same list as the others.

## v12.9.10 - Circle

### Added

- **Teams got rooms.** Beside the paired people, Teams now lists Rooms: a
  group of up to twelve computers in one conversation. You name a room and
  hand out a join code, as text or as a QR that is good for a minute and a
  half; a code on its own gets nobody in, because you confirm every applicant
  by name and by the last four characters of their key. Every message is
  encrypted separately for each member and signed by whoever wrote it, and a
  message that does not carry a valid signature is dropped instead of shown.
  Your own messages say how far they got, "to 3 of 5", with no read receipts
  invented on top. Join a room late and the history somebody hands you is
  marked as history rather than passed off as new. Membership and who is
  actually connected right now are shown as two different things. The person
  who made the room can take somebody out of it, and anybody can block
  somebody just for themselves; taken out, you keep the conversation and the
  room stops accepting anything new from you.
- **Rooms seat agents beside the people.** The member list of a room now has
  "Add agent": pick one of your roster agents and it joins as a member of its
  own, in the same list as everyone else, shown with its owner's name. Anyone
  types @ in the room composer and picks from that one list; naming an agent
  gives it the message as a job. The job runs only ever on the owner's
  computer, with the owner's keys, models and tools - a message can never
  start anything on somebody else's machine, and the agent that runs is
  always the one the person named, never one a model picked. You decide per
  agent who may call it: on request, only after your approval (the default,
  with an approve card in the room), or only you; a waiting job says "waiting
  for approval" to everyone. The job's card in the thread walks the same six
  states the agent cards elsewhere use, its answer arrives as the agent's own
  signed message, and a very long answer travels as an excerpt that says it
  was shortened, with the full text kept on the owner's computer. Honest
  edges: an owner whose computer is closed mid-job shows "interrupted" on
  every device instead of spinning forever, an owner who is offline refuses
  the job by name on the spot, and an owner machine without any AI provider
  fails immediately with a pointer at Settings - the room itself keeps
  working for its people with no provider anywhere. The joining confirmation
  also grew up: instead of four code characters you now compare six words,
  which two people can actually read to each other on a call.
- **Every room has one shared board.** The Board button in a room opens one
  plan for everybody: each row is assigned to a person or an agent through the
  same picker, one list, no second view. Nothing runs until every human member
  has approved the exact list - an approval bar counts "2 of 3 approved" - and
  any change to what runs or who runs it clears every approval, while ticking
  a row off does not. Agent rows run only on their owner's computer, through
  the same job lane the room already uses; a person's rows are theirs to tick
  off or open as a real chat session, and an assignment reaches them when
  Skales is open on their machine - the board itself is the delivery, and it
  says so. When two people edit at the same moment, the newer board wins and
  the person whose change was replaced is told by name, on the board and as a
  toast, instead of losing it silently. Someone removed from the room takes no
  rows with them into limbo: their open rows are handed back, everyone
  re-approves over the changed room, and nothing is ever left running for a
  machine that cannot run it.
- **Two teams can work at the same time.** An Organization run no longer
  occupies the one slot the whole app shared: a second run starts beside the
  first instead of overwriting it, stopping one leaves the other running, and
  the Cockpit lists them separately. A run in progress when Skales was last
  closed comes back where you left it. You can also give a run its own folder
  to work in, chosen once per team and remembered, and a folder that is not
  there says so before anything starts rather than halfway through.
- **A job can be handed to a named team.** Asked to split work across a team,
  Skales now records which team it was and matches each role to that team's
  members, so a role runs with that member's instructions and model instead of
  being a name nobody answers to. A team that does not exist is refused out
  loud. How a team hands work out - only who is needed, everybody once, or
  borrowing from the other teams in the organization - now really changes what happens, instead of
  only being written on the card. The approval card also states the real number
  of jobs it is about to start; it used to say zero every time.
- **The DevKit is in the app.** Switch DevKit on under Add-Ons and a Developer
  section appears in the sidebar; one click there sets the DevKit up: the
  command-line tool, its documentation and examples land in your Skales folder
  with the access key already filled in, and the page names the exact place it
  wrote and what to do next. Pressing it twice is safe, an existing DevKit is
  never overwritten, and a key you already handed to another program keeps
  working. Switching the add-on back off only puts the section away - what was
  written stays where it is.
- **The sidebar shows who is working.** While agents or a team are running,
  the entries that lead to them carry a small live row: who is at it, who is
  waiting for you, and who has just finished, fading out shortly after. It is
  a reading and nothing more, so nothing pops up, nothing makes a sound and
  nothing stays behind to be dismissed. Closing and reopening Skales shows
  what is really running, never a leftover from before.
- **Your phone can fetch a plugin from this computer.** A paired phone can
  now see the plugins on the computer it is paired with, read what each one
  asks for before anything is copied, and take one over. Only the paired
  computer answers, and only its own plugin folder is ever read.

- **Motion videos have a timeline, and sound.** An animated Flow project is no
  longer a sequence of scenes with everything trapped inside one of them: a
  caption, a lower third, a chapter marker or a watermark gets its own start
  time, its own length and its own layer, so it runs across a scene change,
  leaves a gap and comes back later. Audio arrives the same way - voiceover,
  music and effects from files in the project, each with a start, a length and
  a volume - and it is mixed into the exported MP4 rather than only heard in
  the preview. Scrubbing the preview frame by frame stays silent, because a
  frame has no sound to make. Six new scene transitions come with it (wipe,
  wipe up, blur through, push, push up, cross zoom), and a set of ready-made
  building blocks - caption, lower third, title card, stat pill, chapter
  marker, progress bar - that the composition uses instead of inventing one.
  Before a render starts, the composition is read: a clip that begins after the
  video ends, a layer that does not exist, an animation aimed at nothing, an
  audio file that was never downloaded. Each one is named in plain words and
  sent back to be fixed, instead of producing a video with something silently
  missing from it.
- **A recommendation now arrives as cards.** Ask for the good beaches near
  Funtana, six recipes for a Tuesday or the libraries worth reading, and the
  answer comes with a row of cards under it: the page's own preview picture,
  the name, one sentence, tags and the link. The written answer is unchanged
  and stays where it was - the cards carry it, they do not replace it. A page
  with no picture gets a lettered tile of the same height, so the row settles
  once and never jumps while the pictures arrive.
- **Places on a map, without a key.** A row of places gets an "Open in Maps"
  link on every card, which opens Apple Maps or Google Maps depending on the
  machine, and a Map button that draws the whole row over OpenStreetMap.
  Nothing is looked up until you open the map. With a Google Places key
  (Settings, Integrations) a place card also shows the real photograph, the
  rating with how many people gave it, and whether it is open right now;
  without one, a single quiet line under the row says what a key would add.
  Ratings and opening times are never invented: they come from that lookup or
  they are not shown.
- **Plugins.** A new section in the sidebar, between your main pages and the
  system pages. A plugin is a tool of its own inside Skales - bigger than a
  widget, with its own menu entry, its own icon, its own page and its own
  storage. The Plugins page lists what is installed, creates, disables and
  removes; a broken plugin shows what is wrong instead of a blank screen.
  You never have to write one by hand either: ask in a chat for the thing
  you want and it is built, named, given its menu entry and, if it should
  work on its own, its schedule. A plugin may be given your calendar, your
  mail and your messengers - a small customer list that reads the week and
  writes the follow-ups is exactly the point - and every one of those sends
  stops at a card that names the recipient and the text and waits for you.
  Nothing auto-approves that card, not even on a schedule, and the shell,
  the screen and the plugin list itself are never on offer at all.
- **A place to get plugins.** The top of the Plugins page is a gallery. Two
  plugins are inside Skales from the first launch: Daily Brief, a short
  morning brief at 07:30 from your calendar, open tasks and reminders, and Reading
  Stack, a list of the links you meant to get back to, which needs no key,
  no provider and no connection at all. Everything else comes from the
  community directory at github.com/skalesapp/plugins, where anyone can
  publish one. Every card names three things before you touch it: whether
  it reaches the network, whether it can see anything outside its own
  folder, and how many tools it may call. One click opens the card, a
  second installs it, and a community plugin is fetched from its author's
  own release and checked against the checksum published beside it. With no
  connection the last catalogue that was fetched is shown with its date,
  and the two bundled plugins are there either way.
- **A plugin you already have can be updated.** When the catalogue is ahead of
  what is installed, the card says "Update to 1.0.1" next to Open. Pressing it
  writes nothing: it shows what changes first, tool by tool. A tool the new
  version adds is named, one it drops is named, and if your own tool list
  differs from the package's, it says plainly that the package's list replaces
  yours. Confirming rewrites the plugin's definition and leaves everything the
  plugin saved untouched, so a year of briefs and a full reading list survive
  the update. A plugin you switched off is updated and stays switched off.
- **A plugin can also come straight from an address.** Paste the link to a
  package, to the release page it sits on, or just the owner and repository
  name, and it is fetched and installed the same way a catalogue entry is.
  Where a checksum is published beside the file it has to match or nothing is
  written. A plugin that arrived this way says so on its card - it was not
  seen by the catalogue - and it is never updated behind your back; that
  remains something you do.
- **A package says who published it.** A package can carry its author's seal.
  Where the directory knows that author, the card says who published it;
  where it does not, the seal still shows the file is the one that was sealed.
  A package whose seal does not match what is inside is refused with the
  reason on screen, and a package with no seal still installs and is plainly
  named as unsealed rather than described as checked.
- **A plugin built in a chat is looked over before it is handed to you.**
  Skales opens what it just wrote - the pages, the menu entry, the tool list -
  saves one value and reads it back, and tells you in sentences what it found
  and what it could not check, instead of announcing that it works.
- **A plugin travels as one file.** Anything on the shelf can be packaged as
  a .skplugin file to carry to another machine, to publish or to sell, and
  the same file can be brought back in. Exporting asks once for what
  somebody installing it will want to read, and points out anything in the
  pages that looks like it belongs to you rather than to the plugin. Your
  data never travels with an export: everything the plugin saved while you
  used it stays on this machine. Importing shows the permission card before
  anything is written, and refuses a package whose card and manifest do not
  ask for the same things.
- **Gmail through your Google account.** If your Google account is connected
  with the Gmail box ticked, mail works without an app password or IMAP
  form: reading, sending, marking, filing, and the new-mail check. An IMAP
  account you set up yourself always wins; nothing changes for it.
- **ChatGPT sign-in from the browser.** Using Skales from another device's
  browser, the ChatGPT subscription sign-in now works in two steps: copy a
  link, sign in there, paste the address you land on back. The desktop keeps
  the secret half; the pasted page never sees it.
- **Group chats are remembered.** A group discussion lands in your history
  when it ends - or when it is stopped halfway - and every agent can find it
  again on request. Incognito rounds stay unsaved, and the page now only
  claims "not saved" when that is actually true.
- **Skales can watch a video.** Ask about a video file and the agent samples
  the frames, reads the audio, and answers with timestamps. Every ceiling it
  applies is stated in the answer, never silently.
- **Skales can cut your own footage.** Point it at a recording and ask for a
  two minute version of it. It reads the whole recording in one pass first -
  where the shots change, where it goes quiet, what is said and when - and no
  part of the picture goes to a model to do that, so the length of the
  recording is not the obstacle. Then it names the stretches that make the
  film, each with one sentence of reasoning you can read, and lays them into
  the editor's timeline with the thumbnail and the length beside every piece.
  It says what it threw out and why rather than quietly shortening the list.
  Ask for a change - take the third one out, make it shorter - and the plan on
  screen changes; there is only ever one per project, so there is never a
  second plan to wonder about. The editor is marked Beta and does cuts, trims
  and export; it is not a multi-track suite.
- **A 3D scene from a reference image.** The 3D studio takes a picture,
  writes a three.js scene, looks at its own render, lists what is off, and
  patches - up to four attempts, scores visible. The result can be orbited,
  exported as a self-contained page or a glTF model, and shared to Discover.
- **Long generations report back.** An image or video that finishes after
  the conversation moved on now lands in the notification bell and in the
  chat it came from - including Studio renders and editor exports, which
  previously told nobody.
- **Discover reads in your language.** Discover is written in English, and
  every post now carries a Translate button that puts it into the language
  the app is set to - the body, the link-card title and a poll's question
  and options. It runs on the model you already configured, like any other
  small call, so nothing goes to a Skales server. The translation is
  display only: upvoting, replying, reporting, sharing and voting all keep
  carrying the original post, and a poll still votes by position. The same
  button is the way back to the original, a line under the post says which
  of the two you are reading, and a post is paid for once - the translation
  is kept and survives a restart. One press in the sort bar does the whole
  page, up to twenty posts. Without a provider the button is not dead: it
  says so and offers Settings.
- **Conscious carries a thought now, and drifts on its own.** The coloured row
  above the navigation used to move on one thing: work that finished or failed.
  Four things move it now. Skales notes what it is thinking about at the end of
  a turn, in one sentence of its own words, and the panel shows it under the
  reading - it costs no extra request, and a model that has nothing to note
  writes nothing. The clock moves it too, so the state is quiet at night, a
  little brighter in the morning and lower after a long silence. So does the
  shape of the day: a run of failures reads as uphill, one long focused stretch
  as flow, a lot of subjects at once as scattered. And a reply to one of your
  own Discover posts lifts it a little, read from the notifications that already
  arrive rather than from anything new. Under it all is a small local record,
  capped, that loses weight as it ages: a thought that is a few days old stops
  being shown by itself, and "Reset the mood" on the Memory page deletes the
  file. Nothing here asks a model on a timer, reaches the network or produces a
  notification, and with the Conscious switch off none of it is written at all.

- **A long coding run ends with a report.** A Code session that worked ten
  steps or more closes with a run report in the transcript: how many steps,
  how long, what the working tree looks like now on which branch, and which
  checklist items are still open. It is composed from the session itself,
  with no extra model call, and it lands the same way whether the run was
  driven from the Code window or from a chat in Code mode.
- **A long run says how long, and names its own silence.** The Code window's
  status line counts how long the current run has been working, and when a
  running session produces nothing for two minutes the line says "no
  progress for N min" instead of letting "working" stand over a stall.
- **A killed run says it was killed.** Close Skales while a coding session
  is mid-turn and reopening that session now says "interrupted" above the
  composer - the last answer may be incomplete, send a message to carry on -
  instead of showing the same quiet idle a finished run earns. The liveness
  mark is written by the run itself, server-side, so every surface reads the
  same truth.
- **The Guide teaches this release too.** The "I want to ..." page now carries
  the newer surfaces on its machinery level: working in a Team room with other
  people, designing real files in Flow, recommendations arriving as cards, and
  the Conscious mood line. Each card reads its state live off the same
  capability check the assistant uses - a green card is true right now, an
  amber one names the one thing missing and opens that Settings section as a
  popup over the page. The "x of y capabilities active" line follows along:
  type a key into the popup and the count moves with the cards the moment it
  closes. Honest edges: rooms and the mood line need nobody's key, so they are
  never counted as progress you could be behind on; Flow's example lands in
  the Flow window through the same hand-off templates use, editable and
  unsent, and in a plain browser tab it falls back to the ordinary route.

### Changed

- **Skales knows itself in fewer words.** The capability description that
  rides every conversation was cut from prose to one fact line per
  capability - nothing Skales can do left the list, the detail moved behind
  the on-demand lookup that answers "where is X" - which frees several
  thousand tokens on every single turn. The compact prompt variant also
  keeps a short what's-new list now instead of dropping it entirely, and
  the generated interface map names the Get-plugins gallery.
- **Team cards sit denser in the Code window.** The multi-agent cards above
  the composer carried the chat's spacing into a surface that is set flatter
  and tighter; in the Code window they now use smaller radii, paddings and
  gaps, without changing what they say or do anywhere else.
- **The Code window has a real file tree.** Folders collapse, every file is
  visible, and files the preview cannot show open in the editor instead of
  being hidden. The list is no longer capped.
- **Flow only asks when you chose to be asked.** A Flow project no longer
  overrides your safety mode with a leash you never picked - and when it
  does ask, the card names the action instead of a generic sentence. The
  project now carries that choice openly, as a choice you make on the
  project itself, and it is still there when you come back to it.
- **Every card that asks first says more than what.** A card that stops an
  action now names the action in plain words, says what happens if you say
  no, and says how far an "always" would actually reach - before you press
  either of them.
- **Notifications carry the whole message.** The bell no longer cuts a
  report to a preview mid-sentence, and a task result links to the task.
- **Discover posts can travel a safer road.** New builds post through the
  relay, which signs on their behalf; if the relay is unreachable they fall
  back to the direct road. Older builds are unaffected either way.

### Fixed

- **Notifications speak your language.** Around forty of them were still
  written in English whatever the language picker said: a task finished or
  blocked, a schedule that switched itself off, a stand-up, a meeting in ten
  minutes, an approval waiting for you, a Telegram bot that gave up, a room
  board that assigned you something, a video or a cut that finished rendering.
  All of them now come in the language the rest of Skales is in. The half of
  those messages that also lands in a chat, where the model reads it back on
  the next turn, deliberately stays English so a language setting can never
  change what the model was told.

- **The advanced provider settings stay where you put them.** The request
  timeout, the retry counts and the per-model context and output limits used
  to be lost if you left Settings without pressing Save. All of them keep
  themselves now, as you set them, and removing the last override really
  removes it instead of the old value coming back.
- **Restoring a backup works again.** Restoring a backup archive - and
  importing a plugin from a file - failed in the packaged app with an
  unreadable one-line error. The unpacker now runs outside the bundled
  code, a release check holds it there, and both doors open again.
- **Local voices on Linux.** The AppImage shipped a speech engine that
  looked for its libraries in the build machine's directories; the release
  check now reads the shipped binary and refuses a broken one, and the app
  names the real cause on screen if it ever meets one.
- **A downloaded voice is usable immediately.** Voice downloads unpack when
  they finish instead of at the next restart - the download list and the
  voice picker can no longer disagree about what is installed.
- **Local speech hands its audio over safely.** The engine's output is now
  copied before playback; this very likely restores on-device voices that
  produced silence with "external buffers are not allowed".
- **A 3D scene that cannot draw says which of two reasons applies** - a
  missing library and a display without WebGL are different problems, and
  the admin review page says when its preview runtime is missing instead of
  showing a false WebGL error.
- **Four approval cards spoke English to everybody.** Asking to build a
  spreadsheet, to call one of your own API connectors, or to post or upload
  to a social account put the question in English no matter which language
  the rest of Skales was in. All four now ask in your language.
- **The Code window no longer starts underneath the navigation.** With the
  sidebar open, the first characters of every line you typed there were
  hidden behind it. The window now begins where the rest of the app begins,
  in every navigation layout, and the way back out stays visible.
- **Restoring a backup asks first.** A restore replaces the settings,
  memories and connections on this machine and cannot be undone; it used to
  happen on a single click. There is now a switch beside the button that
  says what will be replaced, and it is off again every time you open the
  page. The backup card itself is translated too, buttons included.
- **More link previews find their picture.** A page that names its preview
  image in the less common of the two ways it is written was read as a page
  with no picture at all.

## v12.9.0 - Fable

### Added

- **Skales tells you when it healed itself.** If the background engine dies,
  every open window now shows what happened and why while it restarts, and
  confirms when it is back - including windows that never noticed a thing.
- **New installations start on Claude Sonnet 5.** Existing settings are
  untouched - whatever model you chose stays chosen.
- **The setup now ends with fifteen seconds of Skales, not an empty chat.**
  Pressing the last button plays four full-bleed cards: what Studio makes and
  that it can go into the Discover feed, an agent ticking a goal off by
  itself, Iris listening and answering, and the Guide as the door to
  everything else. One press skips it from any card, it is never shown unasked
  a second time, and with reduced motion switched on the cards stand still and
  you press Next. Guide has a "Watch the intro" line to play it again.

- **Two cards that appear where they are an answer.** The first Skales Visual
  you finish offers to put it in the Discover feed, and a run longer than two
  minutes that finishes while you are somewhere else offers to tell you next
  time - the second one only while notifications are actually off. Each is
  offered once, both can be closed without being asked again, and both stay
  quiet while notifications are muted or during quiet hours.

- **A switch for staying awake in the background.** Settings > Desktop App
  now carries "Stay Awake in the Background". On, which is the default and
  what every release so far has done, Skales keeps the system from parking it
  so reminders, scheduled tasks and autonomous work keep running while the
  window is not in front. Off arms that only while a job is actually in
  flight, which is the setting for a laptop on battery. The change takes
  effect immediately, with no restart.

- **Memory can be searched.** The Memory page opens with a search box over
  everything stored - topic names and the text inside them, across the index,
  the topic files and the saved short-term, long-term and episodic records -
  with hits highlighted and a Meaning toggle that appears only when an
  embedding provider is configured. Skales itself gained the same search as a
  tool, so it can find a note it wrote months ago without guessing the topic
  name, and asking for a topic that does not exist now answers with the
  closest ones that do.

- **The first run now asks who you are before it asks for keys.** A new
  question near the top - newcomer or AI-head - reshapes the whole setup:
  newcomers get plain-language explanations under every technical term and a
  guided provider choice, experienced users get dense screens and can skip
  whole blocks. The answer is remembered and keeps shaping recommendations
  after setup.
- **Setup covers the everyday now.** Theme with live previews, light/dark/
  system, accent tone, your city, weather, notifications, a voice you can
  hear before choosing, safety mode and telemetry are all settled during the
  first run - writing the same settings the Settings page writes, so nothing
  exists twice. Feature cards with small live animations introduce AIPointer,
  the desktop buddy, Iris and Studio, and switch them on right there. A QR
  card pairs your phone without leaving setup, including the allow/deny
  confirmation, and the whole run works offline: every card degrades to a
  named fallback and Continue always stays reachable. Progress survives a
  restart and resumes exactly where you stopped.
- **Docs became Guide.** One page with two entrances: "I want to..." paths
  sorted by how much setup they need, and a catalogue of what is actually
  possible - each line showing live whether your machine is ready, with a
  real example prompt that lands editable in the composer. Settings open as
  a popup on top of the page, and the bundled handbook stays available
  offline. Setup ends on a card that shows how much of Skales is already
  set up.
- **Your experience level reaches a connected phone instantly.** Answering
  the newcomer question on the desktop no longer waits for the next
  reconnect - a paired phone learns it the moment you answer.
- **Setup can be replayed without losing anything.** Guide and Settings >
  General offer "run onboarding again": every answer arrives prefilled with
  the current state, and finishing merges only what you changed - identity,
  sessions and history stay untouched.

### Changed

- **An idle window is idle again.** Around sixty background timers kept
  running at full rate on a window nobody was looking at - the dashboard's
  own CPU readout polled twice a second, the Discover network graph redrew
  its physics sixty times a second, Iris kept a WebGL scene painting behind
  whatever was in front of it, and Studio, Flow, Playground, Playbooks,
  Teams, Logs, the Code window and the Autopilot and Organization panels each
  kept their own. Every one of them now pauses while the window is hidden
  **or** unfocused (only checking "hidden" misses a covered window on Windows
  entirely) and refreshes the instant it comes back, so nothing reads stale;
  clocks read their start stamp rather than counting ticks, so they are right
  on the first tick back rather than behind by however long you were away.
  What genuinely has to run while you are away still does - completed runs,
  renders, recordings, calls, the presentation clock, the buddy, OS
  notifications - and pays with a backoff instead: the notification drain
  went from every two seconds to every ten, stretching to thirty while there
  is nothing to deliver. This cannot quietly grow back, and every case that
  genuinely has to keep running while you are away still does.
- **Flat got flatter.** The Flat sidebar is a menu now, not a row of buttons:
  13px entries, tight rows, no pill on the active item - a soft tint and a
  2px accent edge carry the position instead. Header, status card, switcher
  and foot bar slimmed down to match. Skales X and Classic are untouched,
  and a test walks every Flat rule to keep it that way.
- **Templates is back in the sidebar.** The templates page never left - only
  its door did. It now sits in the System group right under Custom Widgets,
  and every card still lands its prompt editable in the composer.
- **Three themes instead of six.** Obsidian, Snowfield and Neon are retired;
  anyone using them lands on Classic once, with a short notice. Slate is now
  Flat and means it: grey and white, lime as the only colour, a text-only
  sidebar, tighter lines, emojis in greyscale - the logo and the buddy keep
  their colours. Preset accent tones now also work on Flat.

### Fixed

- **The Autopilot cockpit is current the moment you come back.** Returning to
  the window refreshes status, tasks, logs and goals immediately instead of
  showing up to eight seconds of old state.
- **A renamed chat carries its new name into a second window.** Renaming, and
  the automatic title, now reach every surface instead of only the one you
  were looking at.
- **Background notification delivery cannot lose itself anymore.** A wake
  during a running delivery pass no longer forks the schedule, and a single
  failed server answer no longer silently ends it.
- **The token wall now says that it is one.** Changing the remote-access
  token also locks out the Skales window on a paired phone; that refusal was
  indistinguishable from a working page. It now names itself in the reply,
  and nothing changes for older devices.
- **Studio gallery cards keep the shape their media was made in.** A 9:16
  visual is tall in the gallery, the same way it is tall everywhere else -
  instead of being cropped into a square.
- **Reopened conversations show the team pill again.** A turn that fanned
  out to sub-agents records how many worked on it, so the badge survives a
  restart instead of appearing only while you watched.
- **More of Skales' tools name the capability they belong to.** Skales can
  now say what it has instead of only having it, and reports this completely.
- **A slow image no longer dies at an invisible deadline.** The vision path
  now honours the request-timeout setting and grants extra time by
  attachment size, a transport failure ends the turn with a named card and
  a Retry button instead of a raw exception leaking into the answer, and
  the model is finally told that images arrive through vision - it will
  not try to read a JPEG as text any more.
- **A failed send no longer eats your message.** Attachments return to the
  composer when a run is not accepted, and a run that dies before
  answering says so with a Retry instead of silence.
- **One picture, once.** An attached image rendered up to three times -
  live and as a ghost after reload. One layer now wins, and old sessions
  are repaired on display.
- **Chat titles hold still.** No renaming mid-stream, and an automatic
  title no longer reorders your history.
- **Google Drive and Docs actually work.** Creating a document hit a
  broken API path and always failed; downloading a Google Doc or Sheet
  tried to fetch bytes that do not exist and answered 403. Documents
  create properly now (with optional initial text), Workspace files export
  to a readable format, real binaries arrive undamaged as files, and
  errors name their true cause - including a missing permission.
- **The local speech engine names the right gap.** A build missing its
  platform package claimed "not a missing download" - the diagnosis now
  names both possible build gaps honestly.
- **The connection card no longer says "connected" in red.** Its colour was
  chosen separately from its words, and a keyless runtime like Skales Local
  did not count as connected at all. One tone now derives from the same
  state as the label, using theme tokens instead of hard-coded colours.

- **A shared 3D visual draws in the feed instead of showing a black box.** A
  moving visual shared to Discover used to render on the phone and nowhere else
  - the desktop feed and the moderation view showed an empty frame.
  Both now draw the same visual the phone does, and a simpler design still looks
  exactly as it did before.
- **Sharing a visual no longer cuts it in half.** A large shared visual could be
  silently trimmed, which broke it and left a black frame with nothing saying
  why. A share now sends exactly what was made, and one that is genuinely too
  large is refused clearly, up front, with the reason in the sentence.
- **The setup keeps one face from start to finish.** From the feature cards
  onward the wizard's header swapped the Skales mark for the buddy skin you had
  just picked. The mark is now the same on every screen of the run, and the
  buddy is shown where it is chosen.
- **Setup screens are readable immediately.** The feature previews stopped
  animating when they scrolled out of view, but they stopped on whichever frame
  they were standing on - and several of those frames are deliberately faint,
  which left cards permanently half-drawn. A stopped preview now simply rests.
  The step text also fades in twice as fast and can no longer be caught between
  two overlapping fades.
- **Leaving the provider screen without choosing asks first.** Pressing
  Continue with no card selected walked straight past the one question the
  defaults cannot answer. It now asks, in your language, and says what the
  machine will actually use if you go on. Going on still changes nothing.

## v12.8.5 - Mirror

### Fixed

- **A cancelled upload no longer takes the server down with it.** Releasing
  the microphone, reloading the page mid-answer or letting a voice detector
  restart could end the whole Skales server, and with it every agent, the
  scheduler, the autopilot and any background work in progress. The cause sits
  in the runtime's own machinery: it finishes reading an abandoned request body
  by closing a stream twice, from a place no error handling can reach. That one
  fault is now recognised and outlived - written down, with its stack, so it
  stays visible - while every other kind of crash still ends the server the way
  it always has.
- **A released microphone stops costing money.** A transcription whose client
  had already walked away ran to the end at Groq, OpenAI, OpenRouter, Azure or
  Skales IQ, and when the disconnect looked like a refusal, the next provider
  was tried after it. A cancelled recording now cancels the call it started, and
  a cancellation is answered as one instead of as a failed transcription.
- **Pressing the microphone twice sends once.** Every voice surface - chat
  dictation, the chat microphone, Call mode, Iris and audio attachments - posted
  without knowing about the others or about its own previous run, so a fast
  second press or a restarting voice detector put two large uploads on the wire
  at once. A newer recording now replaces the older one cleanly and the replaced
  one leaves without an error message. Several audio files attached together
  still transcribe side by side.
- **The Telegram bot no longer disappears without a word.** An unexpected fault
  ended the bot process leaving nothing written down anywhere, so a restart
  looked like it had stopped for no reason. Every fault is now recorded with its
  stack, and the one stream fault above is survived there too - the bot sends
  media through the same machinery.
- **A tool that runs into a missing WordPress route says which plugin to
  update.** The message a user actually got was "the plugin is not active on
  that site", and it was the wrong advice: on a site that connects fine, an
  older connector simply does not carry the newer routes yet. That diagnosis
  never even reached the screen, because it was tested against the words of
  the message and WordPress does not put "404" in its sentence. Both halves
  are fixed - the reason is read where WordPress actually writes it, and a
  missing Skales route now names the plugin version to update to. It is only
  shown after both address forms have been tried, so a site on plain
  permalinks is never told this.
- **A page is not a post when Skales asks whether it may write.** The check
  that runs before every WordPress call asked for the post rights when the
  tool was about to touch a page, and for edit rights when it was about to
  delete. An account that may edit posts but no pages was waved through and
  then refused by WordPress itself, as a bare 403 the model could not read.
  Deleting and reading now also ask about the object they were actually given.
- **Skales names itself to the connector plugin.** The handshake carried the
  plugin's version but never the app's, so the plugin could not say whether
  Skales was the outdated half of the pair. It now does, and when the plugin
  says so, that sentence is shown next to the one about the plugin. Where the
  plugin publishes its route level, that number decides the message instead of
  the version string - so a site that already carries every route Skales calls
  is no longer asked to update for nothing.
- **Minimax pointed at two different countries at once.** The chat default
  addressed the old `api.minimax.chat`, while the Refresh Models button on the
  same card asked `api.minimaxi.com`, which is the mainland China deployment
  and refuses an international key. Both halves now address the international
  host. A base URL you entered yourself is untouched.
- **Developer, Docs listed tools that do not exist.** Fifteen entries carried
  invented names - among them `calendar_list_events` and `calendar_create_event`,
  which are really `list_calendar_events` and `create_calendar_event` - and one
  entry described a chat skill as a tool. Every name on the page is now the
  name the model answers to, and the safety each one promises is the one that
  is actually applied.
- **A failed WordPress connection says why it failed.** Test Connection and the
  WordPress screen both answered every failure with the same flat "Connection
  failed", no matter whether the site had rejected the token, answered 404, run
  into a timeout or handed back a firewall page. The real reason now reaches
  the screen, in the same words the WordPress tools have always used.
- **A site with plain permalinks connects.** WordPress only serves
  `/wp-json/` when pretty permalinks are switched on; with the default setting
  the identical route exists only under `?rest_route=`. Skales tried the first
  form and gave up. It now tries the other one when the first answers 404, and
  remembers which form that site speaks.
- **An outdated connector plugin is named.** An old plugin answered the
  handshake and then let every newer tool run into "not found". The version is
  now checked at the handshake and named on both screens, including the case
  where the plugin is too old to report a version at all. Nothing is blocked:
  what the old plugin can do, it still does.
- **Two new model profiles ship inside the app.** Muse Glimmer and DBRX were
  added to the shared profile library, but only machines that can reach GitHub
  received them - offline installs kept running both untuned, including Muse
  Glimmer 30B, which Skales' own local catalogue recommends as its agentic
  flagship. Both profiles are now built into the app itself.
- **Local speech now works on Windows and on Apple Silicon.** The engine behind
  dictation and read-aloud loads a native library chosen by platform, and every
  release since it arrived carried only the one belonging to the machine that
  built the package. A Windows install therefore held macOS libraries and no
  Windows one, and reported that the module could not be found - which read
  like a damaged download and was nothing a reinstall could ever repair. The
  Apple Silicon disk image had the same hole with an Intel library in it. Each
  package now carries the library its own machines can load, and no other, and
  a build that gets this wrong stops before it is packaged.
- **A speech engine that cannot load says why, and writes it down.** The old
  message named neither the cause nor the platform and left no trace in the
  system log at all. It now names the missing piece, says plainly that the gap
  is in the download rather than on the machine, and records one line in the
  log so a bug report has something to carry.
- **Google Calendar and Discord can be set up again.** Both cards lost their
  Configure button when the settings switches were unified, and the switch that
  was left behind ran the disconnect: the only control on the card asked whether
  you were sure and then deleted the connection, and nothing anywhere could
  open the panel holding the API key, the calendar IDs or the bot token. Both
  cards carry the full row again - a switch for the skill, Configure to unfold
  the setup, and Disconnect as its own red action with a confirmation. Browser
  Control lost the same button and had its switch wired to the panel instead of
  the skill, so it could be neither turned on nor off from its card; that one is
  fixed too. All fourteen collapsible setup panels in Settings are now checked
  before every build, so a card cannot go unopenable again.
- **Skales knew about YouTube uploads and never said so.** Publishing a video
  is a different Google permission from searching for one, and the capability
  report treated posting to YouTube and LinkedIn as always available whether
  anything was connected or not. It now reports the real state, and when your
  Google account was connected without the upload permission it says exactly
  that, and sends you to reconnect it with YouTube (upload) ticked instead of
  claiming Skales cannot upload at all.
- **Skales can now describe its own memory, and the rest of YouTube.** The
  long-term memory it keeps for you had no entry in the capability report at
  all, so asked what it remembers between sessions it had nothing to say while
  reading and writing that memory every turn. YouTube listed only search and
  kept quiet about video details, channel information, trending and caption
  tracks; browser automation left out attaching a file to a page. Every tool
  family is now measured against the report before each build, so a whole
  feature cannot go unmentioned again.
- **The WordPress tools arrive together.** With on-demand tool loading the 47
  WordPress tools were spread over four different groups and no group named
  WordPress, so a model asked to work on your site fetched whichever group
  sounded closest and got eleven of them, then reported the rest missing. They
  are one group now, called wordpress, and it says what is in it.
- **Generating a picture no longer ends the job it was part of.** An agent that
  made an image halfway through a task dropped a bare "Image generated!" line
  into the chat and stopped there, having never seen the result of its own tool
  - so the task it was given was simply abandoned, and asking it to carry on
  meant explaining the whole thing again. Making a picture is now a step like
  any other: the preview card still appears, and the same turn keeps going with
  the file it just produced. Video, speech and 3D generation already behaved
  this way and are unchanged.
- **A picture attached in a chat is a real file, and Skales says where it is.**
  Attachments were described correctly and then existed nowhere any tool could
  reach, so asking to post one, edit it or convert it failed on a file that
  looked like it was right there. Every attached picture is kept in the
  workspace and its location is now part of the conversation, so the tools that
  need the actual file can open it. Pictures sent from a phone or the browser
  interface were not being kept at all; they are now, in the same place and
  under the same name as on the desktop. The location travels with the
  conversation, so it still works after a restart.
- **One history, whichever agent you were talking to.** Starting a conversation
  with a custom agent replaced the sidebar with that agent's conversations only
  and offered no way back to the full list, while the conversation itself never
  appeared in the normal history afterwards. There is one list again, holding
  everything, and a conversation held with a custom agent carries that agent's
  emoji on its row. Opening such a row switches to that agent, so the reply
  comes from whoever the conversation was with. Narrowing to a single agent is
  still possible on the History screen, where it is a choice with a way back
  rather than a place to get stuck.
- **A shared visual keeps the shape it was designed in, and never lands
  blank.** A visual shared from Studio arrived in the feed without any note of
  the format it was built for, so a square, a widescreen and a portrait design
  were all shown in the same fixed box. The chosen aspect now travels with the
  visual and the feed lays it out accordingly - for visuals shared from a phone
  as well. And a visual whose frame had not been measured yet was scaled to
  nothing at all and read as an empty card; it now waits for a frame with a
  size before it fits itself into it.
- **A Playground space shared to Discover arrives with its text.** The
  description and the category were sent in a place the feed never reads, so
  the card appeared with an empty body under the wrong heading. Both now ride
  where the feed looks for them.
- **A voice preview no longer answers with a different voice.** Trying out a
  text-to-speech provider in Settings read the sentence through the full
  cascade, so a refused key, an empty balance or a dead endpoint all ended with
  the system voice speaking flawlessly and the preview looking like a success.
  The preview now stops at the provider that was picked and prints the reason it
  gave - the HTTP status, the refusal, the missing key - instead of handing the
  sentence on.

### Added

- **Settings > Voice > Fallbacks: every rule that swaps one engine for
  another, written down in one place.** Which voice steps in for which, in what
  order transcription is tried, what happens when the main chat provider fails,
  who reads an image sent to a model that cannot see, where a local image
  generator hands over, and what memory search does without embeddings. The
  voice rule can also be switched off there: with it off a reply stays silent
  and names the reason rather than being read by a voice nobody chose.
- **A rendered video can go to Discover, from every place Studio makes one.**
  Until now only pictures and Skales Visuals had a share: the cloud video, a
  Scenes render, a Type export and a Flow composition all ended at Download.
  Each of them now carries the same Share to Discover button the picture has,
  and an authored Flow page - a 3D scene among them - shares as the visual it
  is. A clip over 4 MB is refused before anything is posted and says so with
  the limit; a shared post waits for review the same way a shared picture
  does. Videos become visible in the feed once the feed server carries the
  matching upload path.

### Changed

- **3D comes back as a scene, not as a web page with a scene in it.** Asked for
  a 3D element, a language model writes a whole landing page around it: a
  headline, two paragraphs, a footer, and a small canvas in the middle. Skales
  now stages the canvas itself and hands the model the frame - a stage that
  fills the view, a camera, a three-point light rig, ground that takes the
  shadow, the resize handler and the loop - and says in as many words that a
  page around it is the wrong deliverable. What the model writes is the part
  that was ever the point: the object, the materials, the camera move and the
  mood. Chat, Studio and Flow ask for it in the same words.
- **Buttons that turn the thing still work.** "A cube with buttons that roll it
  and light it from the sides" is exactly the kind of request the rule above
  could have killed, so the frame has a place for it: controls float ON the
  canvas and let the finger through everywhere else, instead of standing in a
  document around it.

### Fixed

- **A turn that fails says what failed.** Whatever ended a chat turn - a model
  that ran past its time budget, an endpoint that refused the connection, a
  certificate this machine will not accept - the bubble said "Connection error.
  Please try again." and kept the real sentence, the one naming the budget or
  the address, out of sight in the session file. The reason now stands in the
  bubble, in the language the app is set to, with the raw text kept underneath
  it for the retry and the bug report.
- **Dragging a sidebar entry no longer shows a web address.** A slow press on a
  nav row and a small move started a browser link drag, and the ghost under the
  cursor read "http://localhost:3000/..." - the app naming its own dev server at
  the user. Nothing in the sidebar is something to drag, so nothing there drags.
- **"Reasoning off" reaches Ollama.** The setting travelled to every backend
  that has an off switch except the local daemon, where a thinking block is not
  a second of latency but a minute of it. It now goes out as the daemon's own
  parameter on both of its endpoints - the OpenAI-compatible one a text turn
  uses and the native one an image turn uses - so a Qwen or a Gemma stops
  thinking when it is told to. Older daemons that do not know the field answer
  the request unchanged, so nothing regresses on an install that predates it.
- **A connected MCP server's tools are reachable on a local model.** The list of
  tool groups a model can load on demand was written from the tools that
  survived the local model's tool budget instead of from the whole catalogue,
  and on a local model almost nothing survives that is not in the base set. The
  result: no groups were offered, none were registered, and asking for the MCP
  server's group came back "unknown group" for a server that was connected and
  enabled - so its tools were unusable until on-demand loading was switched off
  entirely. The index now describes what CAN be fetched, which was always its
  job, while the tool list still describes what this turn is carrying.
- **Web search set to MCP is honoured before the model chooses, not after it
  fails.** With the built-in search withheld, the model reached for it anyway,
  was told the built-in is set to MCP, and only then went looking - one wasted
  step, every time. Skales now names the connected search tool in the prompt,
  and a call that still arrives at the built-in is carried through to that tool
  instead of being refused. If no connected server actually exposes a web
  search, it says exactly that and names the way out.
- **Skales knows where its own tool-loading switch is.** Asked where to turn
  on-demand tool loading off, it sent people to Settings > Advanced, where there
  is no such control. It is under Settings > Memory, in the Memory Mode card,
  and that is now what the app knows about itself.

### Added

- **A shared Visual opens full screen.** Every Skales Visual in Discover, from a
  flat design to a turning three.js scene, has an expand button on its frame:
  it fills the window, takes the mouse or the finger, and closes with the button
  or with Escape. The card's own frame is put aside while it is open rather than
  thrown away, so closing carries on where it was instead of starting the
  animation over.

## v12.8.4 - Aware

### Fixed

- **A restart says it is a restart.** When the system ended Skales' background
  engine to free memory, the window went black with "Connection lost" and a Try
  again button, and nothing said that Skales was already starting itself back
  up. Every window now says what happened, which attempt it is on, and whether
  the engine was stopped by the system or fell over on its own - and when it is
  running again the surface comes back by itself, with nobody pressing Try
  again. If three attempts are not enough, it says that too instead of leaving
  you at the same button.
- **Skales stops denying what it can do.** Asked whether it could work with
  your WordPress site, it said no, although the connector has been there for
  months and forty-seven tools sit behind it. The same hole swallowed Obsidian
  and the ability to use your computer. All three are in its self-knowledge
  now, each one honest about whether it is actually connected: WordPress
  reports itself as ready once your site and token are stored, not before.
- **A fact said twice is one fact.** Telling Skales your name in three
  different conversations left three separate records saying the same thing.
  Near-identical facts are now folded into the record that was there first,
  which keeps the earliest date and counts how often it has been confirmed -
  visible on the Memory page. Facts that only look alike stay apart: "port
  8091" and "port 8093" are still two facts. What is already stored is tidied
  once, without anything being thrown away.
- **A document Skales writes is a document you can find.** Asking for a
  spreadsheet could report success and leave no file behind at all, because the
  packaged app cannot write the way the library wanted to. Fixed in the last
  release, and now checked on every build by actually writing a workbook and
  reading it back, so a tool that claims success and produces nothing cannot
  get through again.
- **A fresh install leads with what it can do.** Asked what it was capable of
  before any key was entered, Skales read out the long list of everything not
  set up yet. It now names what works right away first - Flow, Code Mode,
  visuals, your local files, the weather - and puts what a key would add into a
  single sentence with the place to enter it.
- **It knows it can draw a 3D scene without a provider.** Flow has written real
  three.js scenes for a while, but the ability was missing from Skales' own
  list, so the answer to "can you do 3D?" came from the model-generating tool
  that needs a provider and an account. It now says the true thing: the scene
  is written and drawn in the app itself, no key involved, and the way in is
  the 3D chip in Flow.
- **The assistant stops opening every answer the same way.** When the same
  short phrase has led three of the last few replies, it is asked to begin
  differently. Tone, warmth, persona and language stay exactly as they were;
  only the repetition goes.

### Changed

- **The shipped app is sealed.** Skales now ships in a hardened package.
  Nothing changes for you - the app installs, starts and updates exactly as
  before.

## v12.8.3 - Intact

### Fixed

- **A finished answer is no longer followed by a second one nobody asked for.**
  A line typed while Skales was still writing goes into the queue, as before.
  Two things then went wrong with it. A queued message that could not be handed
  over was put back, and putting it back is what woke the queue again, so the
  same text was submitted over and over; and the composer unlocks by itself when
  a turn stops responding, which the queue read as "the turn is over" while the
  turn was still running on the machine. Now a message is tried once more at
  most and then waits in plain sight with a Try again next to it, and nothing
  goes out until the run is genuinely finished rather than merely unlocked.
- **Long Telegram answers arrive whole.** Since 12.8.2 the answer is written
  into the message you are already looking at, and that path never checked
  Telegram's per-message limit: a long answer stopped mid-sentence at the last
  piece that still fit. A message that had waited in the queue was worse - it
  counted as delivered although Telegram had refused it, so it never arrived at
  all. Answers are now split and sent in order, with code blocks closed and
  reopened across the split, and nothing counts as delivered until Telegram
  confirms it.
- **Saving a mail account no longer destroys its password.** Changing any field
  on an existing account wrote the row of dots back over the real password. If
  an account is already in that state it now says so and asks for the password
  again, instead of reporting a login failure from the provider.
- **The mail Test button checks what is on screen.** It tested the saved values
  while showing the verdict as a verdict on the ones just typed, so a corrected
  port was reported as refused before it had been tried. Only the password still
  comes from storage.
- **Port and encryption belong together.** Switching encryption moves the port
  the way the label always promised, and the four impossible combinations say so
  at once instead of arriving later as a certificate error - which is also what
  implicit TLS on a STARTTLS port used to be reported as.
- **Skales answers correctly about its own integrations again.** A read-only
  mail account, or a settings file written by an older version, made the
  assistant deny Google, Drive, Docs and IMAP that were configured and working
  the whole time. Nothing had been removed: its self-check read different files
  than the tool catalogue and the settings screen. On local and small models
  those tools could also be squeezed out of the tool budget first; they are now
  protected once configured. A Google account missing one field now names the
  field instead of vanishing.
- **The context size you set for a local model reaches the engine.** It was
  never passed on, so the server chose a window on its own - 4096 on some
  machines - while the banner read your setting back to you rather than the
  window in force. The banner now shows the window the server actually holds,
  changing the setting restarts the local server, and a request that does not
  fit ends the turn once with the real numbers instead of being retried until
  the partial answer has been erased and restarted several times.
- **A local model no longer advertises reading pictures when it cannot.** The
  VISION badge is checked against the running engine, so a model whose projector
  is not on disk says so. An engine that is running with nothing loaded is no
  longer reported as not running, the role buttons say why they are disabled,
  and a start skipped because autostart is off says that too.
- **Raw `<textcall>` markup no longer appears in answers**, and - more
  importantly - the call inside it is now carried out. Removing the markup
  without running the call would have meant asking for something, and nothing
  happening, with no error.
- **Teams, Organization, Group Chat and Swarm are reachable again**, on every
  theme. The pages and the runner were never touched; only the doors to them had
  been taken out, and on the top-bar and icon-rail themes there was no way in at
  all.
- **One conversation can no longer lock the others.** Opening a chat kept the
  previous one's run, which held the input and the history list; starting a new
  chat was the only way out. A conversation that cannot be drawn now shows the
  reason and leaves the rest of the app alone.
- **Allowing something "for this session" holds across Chat, Code and Flow.**
  The three surfaces kept three separate notes of it, and in Code the answer
  could land in a copy the waiting run never saw, so the same question came back
  after it had been answered. In Flow a card showed "running" even when the
  answer could no longer be applied - after a restart, for instance; it now says
  the runner was lost and asks you to send again.
- **Rewrite (/spin) keeps what it produces.** The rewritten text was only put on
  screen, so the next refresh of the conversation removed it again - the feature
  ran and appeared to do nothing. It is written into the conversation now, and a
  write that fails says so and leaves the text where it can still be copied.
- **The Home/Chat switch shows the column that is on screen.** Opening a
  conversation raised the chat column while the switch still lit Home. Your
  stored preference is left alone.
- **Portrait pictures in Discover are shown whole** instead of cropped to a
  band.
- **Browser Control can attach a file to a web page.** Upload fields that a page
  hides are now listed and can be addressed directly, including through the
  button in front of them, so no operating-system dialog is needed; the field is
  read back afterwards and a mismatch refuses to submit.
- **Custom endpoints are first-class in the agent editor.** Each server you set
  up appears under its own name, the choice survives reopening and restarting,
  and an endpoint that has been switched off is named rather than shown as
  "Default".
- Memory "Minimal" now says what it does: it shortens the memory context, and
  the tool schemata have their own switch directly below it.

## v12.8.2 - Mood

### Added

- **Your Obsidian vault is a folder Skales lives in, not a copy it took.** The
  old import read your notes once and kept a snapshot, so everything you wrote
  afterwards was invisible while Skales still answered as if it knew. Settings,
  Integrations, Obsidian Vaults is where you point at the folder itself, give it
  a name ("Personal", "Work") and add as many as you keep. Every question reads
  the files on disk, so what Obsidian shows you is what Skales sees, and you can
  say "look in my Work vault" and be understood. The Memory page shows the note
  graph of whichever vault you pick, and offers to remove the old copy. The
  integration ships as a beta, and connecting the first vault asks one honest
  question first: what Skales reads goes to your selected model uncompressed,
  which costs tokens on long notes, and backups stay your job.
- **Skales can write into the vault, and never over it.** It can start a new
  note and add to an existing one, at the end or under a heading you name. It
  cannot replace a note: a create that would land on a note that already exists
  refuses and points at appending instead, so ten years of notes cannot be
  overwritten by a misunderstanding.
- **Where new notes land is a setting, not a request.** Target folder, filename
  pattern, note template and a tag on everything Skales files are yours to set
  under the vault list, with {title}, {date}, {time}, {content} and {tag} as
  placeholders. Leave them empty and a note lands in the vault root under its
  own title.
- **Your notes answer with what is in them.** Frontmatter and #tags are read
  along with the body, "tag:project" narrows a search to notes carrying that
  tag, and a note comes back with the notes that link to it and the ones it
  links out to.
- **Conscious: the mood it carries is in front of you while you work.** The
  companion's state was real and kept, but it was only ever readable on the
  Memory page, which is not where anybody is when the work is happening. There
  is a row of its own now, pinned above the bottom of the navigation and in view
  the whole time you are in a conversation. The colour is the mood, warm when
  the work is going well and cool when it is not, and how full it stands and how
  fast it moves is the energy. It changes while you are talking, not on the next
  restart. Hovering it opens a panel that says what the colour means, what moved
  it today with the times, and what is missing, where missing only ever means
  something that is in the record: a long silence, or a day with nothing
  finished yet. If interest tracking is on it lists what it keeps coming back
  to. It is a child of the companion switch in Settings, Memory, it draws and
  nothing else, and it never notifies, sounds or starts a conversation.
- **The mood keeps its day, and the things that move it can happen.** The state
  kept only the current value and threw every event away, so "what happened
  today" had no answer; there is a rolling log of the last two days now. Four of
  the seven things that can move the mood had no source in the code at all: a
  finished goal, a goal that did not get there, a run stuck on the same error, a
  long silence and a long stretch of work all register now. Resetting the mood
  on the Memory page clears the day's list with it.

- **Telegram answers in one message, and it writes as it thinks.** A question
  put to the bot produced a "Thinking..." line and then, some time later, a
  second and separate message with the answer in it, so a conversation with
  Skales on the phone read as twice as many messages as it had. The answer now
  grows inside the message that says it is working, the way it does in the chat
  window, and there is no second message at all.
- **A file Skales makes arrives as a file.** A spreadsheet, a PDF or a written
  document used to come back as a path in a sentence: unreachable from a phone,
  meaningless in a chat window on another machine, and a string to copy by hand
  here. The answer now carries a card with the name, the type and the size, a
  Download button and a way to open the folder. On Telegram the file itself is
  sent into the room the question came from, and a file the bot cannot send,
  because it is over the 50 MB the Telegram API takes, says so with its name and
  where it is instead of vanishing.
- **Saving a character with the companion switched off asks whether to turn it
  on.** The character shapes how Skales talks whether the switch is on or not,
  but everything it LEARNS - the mood, the topics, the working history - needs
  the switch. Saving a character while it is off now asks once, in a dialog,
  and takes no for an answer permanently. Nothing is turned on without the
  answer being yes.

### Fixed

- **Telegram answers once.** Every reply arrived twice, and the notice that a
  message is waiting arrived twice with it, while the send-a-message tool posted
  exactly once. Nothing was sending twice: two bot processes were reading the
  same chat. The lock meant to allow only one of them checked whether it existed
  and then wrote it, and two bots started in the same moment both read "no lock"
  and both went on to poll. Telegram hands the same message to both, and the
  repeat check that would have caught it lives in each process separately, so
  neither could see the other. The lock is now taken in one indivisible step,
  the loser stops instead of polling, and it only ever clears its own. Restarting
  never helped before because the start itself was the race: opening the app asks
  three places at once to make sure the bot is running, and each one started its
  own. They share one attempt now. There was a second double hiding under the
  first: an answer that had grown inside the Thinking message was posted once
  more as its own message, because the note saying it was already delivered was
  dropped on the way back to the bot. That note now travels with the answer.
- **A line typed while Skales is thinking goes into the queue.** During the
  thinking phase, before any text appears, pressing Enter left the sentence
  sitting in the box: not queued, not sent. The queue was real, the decision to
  use it just came too late, behind other work that could take the send first. A
  turn is running from the moment it starts, not from its first word, and from
  that moment every typed line is taken, the box clears, and what was typed is
  answered together with the rest. A stop command still goes straight through to
  the run it is meant to halt.
- **Opening Skales no longer arrives as a wave of pop-ups.** Everything that
  catches up when the app comes up, the briefing, the messages a channel held
  while it was away, the check-ins armed while it was closed, reached the
  screen at once in the first
  seconds, before there was any chance to read one. For the first minute after a
  start they are recorded and left on the Notifications page instead of firing.
  Nothing is lost and nothing is dropped, and anything urgent still comes
  straight through.

- **The button that adds your own endpoint opens something.** Under Settings,
  AI Providers, the "+ Custom endpoint" tile marked itself open, took the page
  to the bottom of itself and showed nothing at all, so there was no way left to
  add or edit an endpoint. The block it opens was classed as an Advanced-view
  section while the tile stood in both views, and a search that found the tile
  could miss the block the same way. The tile and what it opens are one thing
  now, in either view and under any search.
- **A model list that cannot be fetched says why.** Pressing Fetch Available
  Models on an endpoint that was not running answered "no models returned", an
  endpoint answering 404 or 401 was reported as a server that had never started,
  and an address whose name does not resolve said "fetch failed". Each of the
  five reasons now says what it is: nothing is listening, the name did not
  resolve, it took too long, the address answers but serves no model list, or it
  wants a key. An address typed without http:// is completed rather than
  refused, on every one of these paths.
- **The models an endpoint answers with are offered on it.** Fetch wrote the
  catalogue away and the endpoint kept a bare text box, so the button reported
  success and nothing on screen changed. The endpoint's own models are a picker
  now, with free text still there for a model the server does not list.
- **An endpoint you remove stays removed.** Removing the last extra endpoint and
  saving looked right until the next start, when it was back with the same
  identity, because an empty list was never written. As a consequence a
  perfectly ordinary Custom endpoint also grew a duplicate of itself in the
  endpoint list on every start. Both are gone, and removing an endpoint now
  clears the copy of it the app keeps for routing instead of leaving it behind
  for good.
- **An extra endpoint can be named wherever a provider is named.** It could be
  made active and handed to an agent, but the fallback chain, the advisor and
  executor, the per-mode overrides and the Code model offered only the built-in
  providers, so an endpoint could not stand in for the provider it was replacing.
  All five offer it now, and the "Custom model..." entry in four of those lists
  is translated instead of English-only.

- **Skales Local can see.** A model downloaded together with its vision file
  answered "I cannot look at images". The engine was being handed the models one
  by one with no way to know which vision file belonged to which, so every model
  loaded as text-only. They are paired now, and the card's size is the total of
  both. A vision model you brought yourself is paired as well, whatever the
  publisher happened to call its vision file.
- **A model you download is usable straight away.** The engine read the library
  once, at startup, so anything downloaded, imported or deleted while Skales was
  open was invisible to it until the app was restarted.
- **The local server stops when you stop using it.** It came up when you chose
  it and then stayed up for the rest of the session, holding gigabytes of memory
  for a provider you had since switched away from. Switching away now takes it
  down, switching back brings it up, and a server you started by hand is left
  alone.
- **Start and Stop are on the Skales Local tab.** The banner said the server was
  not running and offered nothing to press, while pointing at the desktop
  application you were already looking at. A start that fails now shows the
  engine's own last lines with it.
- **Deleting a local model unbinds it everywhere.** The file went, the routing
  went, and the copy of that choice on the provider card stayed - so a deleted
  model went on being the one a new chat loaded.
- **The reasoning control works on a local model.** It was inert. Its lowest
  rung now switches the thinking block off for that turn, which on a machine
  producing a few tokens a second is the difference between an answer and a
  budget spent entirely on reasoning nobody reads. On the phone, session titles,
  greetings and memory lines never think at all.


- **`/spin` runs when you pick it.** Typing `/spin` and pressing Enter chose the
  command out of the suggestion list and put it back in the composer, and
  nothing else happened - the rewrite only started on a second Enter. Picking a
  command that needs no words after it now sends it, which also brings back
  `/projects`.
- **Rewrite selection is reachable.** Selecting an answer with a triple-click
  and right-clicking it showed the whole-message menu: the selection technically
  ended below the bubble, so it counted as belonging to no bubble. A selection
  that starts in a bubble and picks up no text from outside it is that bubble's
  selection again.
- **The model you set as Main in Skales Local is the one that answers.** The
  chat read the provider card ahead of the Chat row of the matrix, so the row
  only ever took effect while the card was empty. The row also says, under it,
  which model the next turn will load.
- **Extra endpoints behave like providers.** "Fetch Available Models" stayed
  disabled with "Enter an endpoint URL first" on every endpoint after the first,
  because the check looked for the address in the wrong place. Agents can be
  pointed at a specific endpoint too: each one is its own entry in the agent
  editor, stored under its own name, and it is still there when the agent is
  reopened.
- **All four doors under the Flow composer.** 3D and the Video Editor were
  missing from Studio inside the app; they were never drawn there rather than
  cut off.
- **Typing in a long chat.** A keystroke in a three-hundred-message conversation
  took 150 ms and re-rendered every bubble to change nothing. It no longer does.
- **Text size is about the conversation.** The setting scaled code blocks, HTML
  previews and the reasoning panel with it, which is not what it says it does.
- **The line under an answer is filled in.** How long a turn took, how many
  memories it recalled and how many agents worked on it were shown for turns the
  window ran and never for the ones the server ran, and disappeared on reload.
- **A goal stops saying it is done when it is not.** A run could declare a goal
  finished while criteria nothing had ever confirmed were still open: only the
  ones naming a file or a command were checked, and everything else counted as
  agreed. An unconfirmed criterion now blocks completion, and when the run and
  the check disagree the goal comes to you with both views and an "Accept as
  done" button, instead of either closing quietly or being nudged in circles.
- **A finished goal names its evidence.** The closing line said "5 of 5 done";
  it now lists each criterion with what settled it, and accepting a goal
  yourself lists what the check could not confirm.
- **Projects are reachable when the agent is told it has them.** The system
  prompt named the four project tools outright while the request often did not
  carry them, so the model reported it had no access to projects. They now ride
  in the base set. CHECK CAPABILITIES also states which tools the current turn
  is actually carrying, measured on the request, rather than only what the
  registry has switched on.
- **Vision over your own OpenAI-compatible endpoint.** Three separate faults on
  one path: a model whose name ends in "-VL" (LFM2.5-VL and the whole naming
  convention) counted as blind, so the picture was removed before sending; an
  answer written as content parts rather than one string arrived as an empty
  reply; and a pasted ".../v1/chat/completions" was turned into a doubled path.
  A picture that cannot be sent now says which switch changes that, and
  "Skales Local" works as a Vision Provider.
- **A second skill of the same name opens its own page.** The menu entry was
  built from the name while the skill was stored under a de-duplicated id, so it
  pointed at the first skill.
- **Skill pages are sealed like widget pages.** A skill that returns HTML runs
  without access to the app around it and cannot load from outside sources; a
  blocked resource says so on the page instead of failing silently.
- **The Custom Widgets page speaks your language.** Its result and error
  messages were English regardless of the language setting.
- **Text with line breaks reaches the field it was meant for.** Typing put text
  into a page one key at a time, and every modern editor - X, Instagram, Reddit,
  a CMS - handles the Enter key itself, so paragraphs ran together into a single
  line. A 220-character post with six line breaks arrived as 214 characters on
  one line. There is now a step that places text in one go, line breaks and all,
  and it is what the assistant is told to use for anything longer than a search
  box.
- **Nothing is typed into a field that does not have focus.** Text used to be
  sent to whatever happened to be focused, and the check for where it landed
  came afterwards. The target is verified first, and a page that steals focus
  back gets a refusal that names what holds it instead of a write into nowhere.
- **Every write is read back, and the readback is the truth.** After writing,
  the field is read as it renders, line breaks included - the old check read a
  form that has no line breaks at all, so a broken write and its confirmation
  agreed with each other. The answer says whether the field matches exactly and,
  when it does not, which line differs first. There is also a step to read a
  field on its own, for when you want to confirm before submitting.
- **A dialog is no longer dismissed behind your back.** A confirm, an alert or a
  "discard this?" prompt was closed automatically and never mentioned, so the
  assistant only saw the aftermath. Those are now named in the result, and an
  in-page modal is named too, with the choices it offers.
- **The screenshot shows the action, not the moment before it.** Screenshots
  could be taken before the page had drawn the change, so the picture showed the
  previous state.
- **Browser and desktop control survive a tight tool budget.** Pressing a key
  and scrolling sat outside every priority tier, and so did all desktop control,
  which meant a small local model kept the tool that fills a field and lost the
  one that submits it.
- **Desktop control says when it is not allowed to run.** Without the macOS
  accessibility permission every click and keystroke silently did nothing and
  reported success; it now names the setting that fixes it. A click outside the
  screen is refused with the real screen size instead of reported as done, the
  pointer is checked afterwards, and typed text can be read back out of the
  focused field. Multi-line text types line by line, and on Linux the text is
  handed to the keyboard tool directly rather than through a shell that would
  reinterpret it.

- **The keyboard can see where it is in Studio.** Tabbing into the Flow composer
  or the project search moved the cursor there and changed nothing on screen:
  both fields switched the focus ring off and never put anything back, so a
  keyboard user had no way to tell which field they were typing into. Both now
  show the same ring every other field in Skales shows.

- **Shutting the computer down is not a crash.** Logging off or restarting
  Windows killed the Skales server mid-session, Skales immediately started a
  replacement that the ending session could not let start either, and both
  deaths were written down as crashes, with a "Server stopped" box on a machine
  that was already going away. A session that is ending is recognised now:
  nothing is restarted, no error box appears, and the entry is listed under
  ordinary shutdowns. Exit codes in the report are spelled out in words,
  including for reports written before this build.
- **A question from Skales stays answerable.** The card that asks you something
  was only live while it was the last thing in the conversation, so anything
  landing behind it, a message you typed, a follow-up run, a tool line from the
  same turn, killed its buttons for good and re-asking never helped. A question
  is live now until you answer it, in the chat and in the Code window, which
  read the same rule from one place. A turn that both draws an image and asks a
  question now asks it instead of ending on the image, and the idle prompt steps
  over an unanswered question instead of starting a second run under it.
- **Finishing a Google connection says what happened when it fails.** The screen
  answered "Failed to fetch", which is the browser's words for "Skales was not
  there", and it could hang on "finishing" indefinitely. It now says that
  nothing was connected and nothing was lost and where to start again, keeps the
  raw line underneath for a report, and gives up after a minute with its own
  sentence.
- **Crash recording is on in release builds.** The diagnostics report said
  "process crash recording is OFF in this build", and it was right in every
  release build there has ever been: the handlers hung on a hook that the
  pinned Next version does not run. They are installed from the heartbeat now,
  which runs in every packaged build. It writes to a local file and sends
  nothing.
- **The bug report tab speaks your language.** Any status the server sent that
  this build did not know fell back to hardcoded English, "resolved" was not
  known at all, and a status written with more than one hyphen was never
  matched. All of them are translated now, including the words the server uses
  for the same state, and the status colours come from the theme instead of
  fixed hex values.
- **Five whole screens stop answering in English.** Hugging Face provider
  settings, Spaces, Datasets, casting and the DeepSeek thinking controls were
  never translated, so 32 buttons and labels in the provider settings alone
  stood in English in all eleven other languages. 733 strings were translated,
  and a check now catches a value that is identical in all twelve languages so
  the next block cannot slip through the same way.
- **The error page's retry button reloads instead of crashing.** Pressing it
  mounted the router a second time in the same document, which is the one thing
  it cannot survive, so the recovery from an error was a second error. The Iris
  screen carried the same class of unguarded read and no longer does.

- **New starts a new chat, from both buttons.** The plus in the header opened the
  new-chat page while New in the conversation list emptied the conversation you
  were in without leaving it, and an emptied conversation had nothing to show:
  a screen-high blank that read as a crash. Reloading appeared to fix it, which
  only hid it, because the reload brought the old conversation back. Both
  buttons lead to the same place now, deleting the conversation you are in does
  too, and a wait long enough to notice shows a loading state instead of an
  empty screen.
- **The feedback box stops cutting long notes in half.** Everything past 4.000
  characters was silently thrown away as you typed, so a pasted paragraph
  arrived halved and nothing said so. The box now declines the extra characters,
  and once a note is long enough to be near the limit it says how many are left.
- **The mood says one thing, not two.** The word above the companion's mood bar
  and the highlighted line in its legend were computed from two different
  thresholds, so the panel could say "low-key" over a legend marking "good".
  There is one threshold now, and the sentence, the legend and what Skales
  itself is told all read it. The words changed with it, from instrument
  readings to how the work is going: rough, uphill, steady, good, flying.
- **Settings points at a page that answers.** Under Settings, Memory, the line
  offering to shape your companion's character led to the Memory page but not to
  the section it meant, and with the switch off that section answered with an
  empty card, so the trail ended in nothing. The section is a target now, it
  says what is on it, and it keeps the character form whether the switch is on
  or off.
- **Making a spreadsheet works in the installed app.** The tool has never once
  worked outside a development tree: the library it uses looks for its file
  access at the moment it writes, and that does not survive being packaged, so
  every attempt failed with a message about the folder not being writable. The
  folder was fine. Reading spreadsheets had the same fault.
- **A file asked for in a group arrives in that group.** `send_telegram_file`
  always sent to the paired chat, so a table someone asked for in a group
  landed in a private conversation instead. It goes to the room that asked.
- **Two quick messages on WhatsApp are one conversation, not two.** Nothing
  serialised them, so a second message while the first was being answered
  started a second agent running on the same conversation at the same time.
- **The queued-message banner hands back everything it is holding.** Pressing
  Send on it put the first queued message in the box and quietly dropped the
  banner with the rest still in it.
- **A file card stops offering a file that is gone.** The card is drawn from
  what the turn recorded, so a file deleted or moved since kept a full card and
  a Download button that answered with an error. Every card checks again.

### Changed

- **The free end of the model list is on the desktop too.** The three smallest
  models were listed for phones only and were therefore invisible on a computer,
  which is where most people try Skales Local first. The entry point is now
  530 MB instead of 2.5 GB, and it thinks, calls tools and reads images.
- **One row per model.** The same model appeared twice in the library under two
  names, once with its capabilities and once without.

- **Messages you send while Skales is working are answered together.** Each one
  used to become a turn of its own, so three impatient messages meant three
  answers to three halves of a question, and the wait multiplied. They arrive
  as one message now, in the order you typed them, separated by a blank line,
  with nothing added and nothing numbered. The chat window, a run on the
  server, Telegram, WhatsApp and the phone all do it the same way, and Telegram
  no longer sends a "position in queue" card per message.

## v12.8.1 - Rewrite

Two kinds of text get looked at in this release. The first is what a model
leaves in its own answers: the characters nobody can see and the typography that
reads as machine-written now come off, if you ask for it, and `/spin` writes a
text again in a plainer voice. The second is what Skales carries about you,
which is now something you can see, shape and delete: the assistant has a name,
a character you set with sliders, and a working history that grows out of the
work you actually did together.

Underneath it, shell works on a local model again, remote access can ask for a
second factor, autonomous workers can be your own agents, the local server
starts when you have chosen it, and the interface finished a long consolidation:
the controls, the type scale, the colours and the window chrome now come from
one place across the whole app.

- **Check-ins arrive again when the only thing stopping them was the mute.**
  Friend Mode read "on", named a channel and stayed silent, because muting live
  notifications quietly stops every scheduled check-in and nothing on the Friend
  Mode page said so. It says so there now, with the way to the switch. The Test
  button deliberately ignores the mute, so it also says when it just did -
  a green test over a blocked schedule sent people looking in the wrong place.
- **One notification is one notification.** A recurring reminder such as the
  morning greeting only started its own cooldown once a channel had actually
  delivered it, so while anything held delivery back - the mute, quiet hours, a
  frequency setting - it was recorded again on every heartbeat. A single
  greeting could fill the entire Notifications page and push everything else
  off it. The cooldown now starts when the notification is recorded.
- **Quiet hours and the frequency setting reach the in-app toast.** Toasts and
  their sound are a live channel, but they were rebuilt from the durable record
  and only ever consulted the master mute. A category set to "Once" still
  popped every time, and a notification during quiet hours still chimed at
  night, which left the master mute as the only switch that really worked. They
  follow the same settings every other channel does. The Notifications page
  still lists all of it.
- **Proactive notifications no longer double their emoji.** Seven of the eight
  carried it twice ("☀️ ☀️ Good morning!"): it was part of the text and added
  again on display.
- **A setting changed in the notifications popup stays changed.** The popup
  opens over the Settings page, so changing a Friend Mode option afterwards
  wrote back the older copy of your preferences and silently undid it.

### Added

- **Skales Visuals is something you can ask for.** The generator that designs a
  poster, a title card, an infographic or an animation as a real page was only
  reachable from the Studio screen, so asking the chat for a graphic got you an
  apology. It is a tool now: ask in the chat or in the Code window, and the
  finished design is drawn in the answer and saved to the same Studio gallery a
  Studio-made one goes to. Asking for a change ("wider", "more colour") changes
  that visual instead of designing a new one. It needs no image provider and no
  key.
- **3D, and the difference between the two kinds.** A three.js scene - lit,
  turning, drawn in the answer - now comes out of the same visuals path, and
  three.js is in the app, so no page has to fetch it. Separately, a real `.glb`
  model file can be made from a description or from a picture through Replicate,
  fal.ai, Meshy or Tripo, saved to your workspace, and turned and zoomed in the
  chat and in Studio. Skales says which of the two it is giving you: a scene is
  a picture, a model is a file you can open in Blender. Where WebGL is not
  available the page says so instead of going black.
- **Video Editor, stage one: the cut.** A timeline with a video and an audio
  track, clips from the Studio gallery and from your workspace, trim, reorder,
  delete, and export. It goes through the renderer Studio already uses - there
  is no second encoder - and an export that was interrupted comes back as
  finished or as stopped, never as a bar that says "running" for ever.
- **3D is something you can pick in Flow.** The composer has a "3D scene" mode
  next to Deck, Prototype and the rest: pick it, describe the scene, and Flow
  writes a real three.js page that the preview draws and turns. There is no
  provider and no key involved - three.js travels in the app - and a brief that
  says "3D" lands there on its own when the mode is left on Auto. A downloadable
  `.glb` model file is still the other thing, and still needs a provider; the 3D
  tile now says which of the two is which.
- **Two more doors in Flow.** 3D and the Video Editor sit beside Lio and Studio
  Classic, in the same tiles.

### Changed

- **The Widget AI form recommends instead of warning.** It opened with a red
  panel about an alpha phase, a corrupted setup and a backup to make first, for
  a feature that has been shipping for months. What is left is the part that was
  ever useful: an orange note that a premium or a coding model gives the better
  result. Twelve languages.

- **The video editor says it is in beta.** It carries the same amber badge
  Skales Local wears, both on the door in Studio and on its own heading, so
  what it is is clear before you walk in rather than after.

- **The character step no longer uses an internal name.** Setting up your
  agent's character said "Form your Zenit", which is what the mechanism is
  called in the source and means nothing to anybody else. The heading already
  says what the step is for, in all twelve languages.

- **Work that was invisible reaches Discover and the usage figures.** Designing
  a visual from the chat, making a 3D model and exporting a cut from the video
  editor all did their work and then appeared nowhere, while the same work
  started in Studio did. A designed graphic and a 3D model also stopped being
  filed as "images generated", which they are not: each has its own name in the
  feed now. Opening Analyze and answering a question card are counted as usage
  only and never reach the feed - what was asked, what was answered and what a
  session spent stay private.
- **The media tools ask what you have set up instead of announcing an order.**
  `generate_image` used to state its own cascade in its description - local
  ComfyUI, then A1111, then Skales Local, "otherwise Gemini or Replicate" - and
  Replicate was not in that sentence at all. So somebody with a Replicate key
  who asked for a picture was told about Gemini. And the tool that should answer
  "what can I make here" only knew about local backends, so a machine with cloud
  keys and no ComfyUI answered with an empty list, which reads as "not
  possible". There is one place now that works out what this machine can do -
  local backends, the built-in engine, every configured provider, Skales IQ and
  an endpoint you added yourself - and every media tool asks it. Name a provider
  you have and that one is used; name one you have not set up and Skales says
  so with the way to set it up, never a substitute and never "not possible".
- **three.js and GSAP travel with the app on the computer too.** The generator
  used to hand the model two CDN script tags. They are in the page before it
  runs now, on both the computer and the phone, and `cdnjs.cloudflare.com` has
  left the list of places a generated page may reach - on both.

- **Analyze: what a run spent, and whether anything went wrong.** Right-click any
  conversation in History or in the chat sidebar and pick Analyze, or click the
  spend bar under an answer or the context figure under the composer. A wide bar
  shows where the tokens actually went - system tools and system prompt, the
  conversation, what came back from the provider's cache, thinking, and the
  answer itself - and the fixed prefill is usually the largest slice by far,
  measured at the real payload rather than estimated. Under it the run is a log,
  one row per turn, foldable: the model, where the turn came in from, the tools
  in order with their arguments and results, the thinking text as thinking, the
  providers that failed before the one that answered, and a voice note with its
  transcription and the honest statement of where it was transcribed. Every turn
  carries a verdict derived from signals the run already recorded: ran clean, a
  provider failure, a model failure, or a failure of Skales itself, which gets
  its own tone rather than being filed under the model. Where the signals cannot
  separate the provider from the model, it says the cause is not clear instead of
  guessing. There is no grade, no score and no percentage. **None of this calls a
  model, and nothing leaves the computer** - it reads what the run already wrote
  down, so opening a report costs nothing. What a provider never reported is
  shown as not reported, which is a different thing from zero.
- **A typeface for the chat bubbles.** Settings, Appearance, above Text size:
  Inter, Lora, Comic Neue or Caveat. All four travel inside the app, so the same
  choice looks the same on every machine. It applies to the text of the bubbles
  and to nothing else - code, previews, tool cards and the thinking lid keep
  their own type, and code stays monospace under every choice.

- **Watermark: what comes off an answer before you read it.** A new section in
  Settings -> Chat & Code, off by default. **Remove invisible characters** takes
  out the zero-width spaces, text-direction marks and unusual spaces a model
  leaves behind, and changes nothing you can read. **Neutralize typography** is a
  separate switch because it edits visible text: the long dash becomes a comma
  and the one-character ellipsis becomes three dots, in Chinese and Japanese too,
  where the dash carries no spaces and a rule written for English prose finds
  nothing at all. **Straighten quotes** sits under it. Code blocks and inline
  code are never touched by any of them. What this does not do, and does not
  claim to do, is remove a statistical sampling watermark: that lives in the
  choice of words.
- **Rewrite, with `/spin`.** `/spin <text>` writes a text again in a plainer,
  more human voice; `/spin` on its own does that to the last answer, and the
  message menu offers the same action next to Copy. Pick the model that does it
  in the same Watermark section, or leave it on the one that is already
  answering; a local model keeps the text on your machine. The result always
  goes through the invisible-character pass, whether or not the switches above
  are on, because a rewrite model stamps its own markers in like any other.
- **Your assistant can have a name, and a character you set.** Settings ->
  Memory -> Companion, then **Shape your companion** on the Memory page: give it
  a name, pick a starting point (Companion, Colleague, Mentor, Sparring partner,
  Trickster, Quiet type), and move seven sliders - serious to playful,
  diplomatic to direct, dry to funny, polite to cheeky, speculative to grounded,
  and two new ones, businesslike to warm and answers-only to asks-back. All of
  it shapes how it talks to you in every conversation. A name is what you call
  it; it never claims to be a different model, and it still answers truthfully
  when asked what it runs on.
- **A working history that grows.** With the companion switched on, Skales
  counts the days you worked together, the messages and the goals you finished,
  and uses that to drop the introductions and use your shorthand instead of
  rebuilding context every time. It counts shared WORK and says so: it never
  claims to have missed you or to be fond of you, and a test walks every state
  it can reach looking for exactly that sentence.

- **A second factor for remote access.** Settings -> Security -> Remote access
  can now ask for a six-digit code from an authenticator app (Google
  Authenticator, Authy, 1Password) when a browser opens a remote session, with
  ten one-shot recovery codes for a lost phone. It is off until you set it up,
  and it is deliberate about what it covers: a browser signing in with the
  access URL is asked, and programs that send the token as a header - the mobile
  app, the relay, a headless instance, swarm peers - are not, so nothing that
  works today stops working. The card says that in as many words rather than
  implying more.
- **Dispatch from your own agents.** Settings -> Autonomy -> What a sub-agent
  starts with has a new option, **Pick from my agents**: tick the agents that
  may run as dispatched sub-agents and Skales chooses among those by name. Each
  brings its own instructions, skills and pinned model; the tool limits every
  autonomous worker has still apply to it unchanged.
- **The role presets are readable.** The same setting can now show, word for
  word, what a dispatched worker starts with: the tools every role gets, what
  the chosen role adds, whether it may dispatch workers of its own, what it can
  ask for at runtime, and what is never available to it.
- **Interests and mood.** One switch in Settings -> Memory, off by default.
  Skales tracks the topics you keep coming back to - at the level of the topic
  rather than the conversation, and down to which part of a topic - and carries
  a working mood between sessions. Both feed the messages it sends on its own,
  so a briefing or a Friend Mode note reads like it comes from someone who knows
  you. The mood is about the work, never about you, and it appears in a reply
  only where it fits.
- **Skales Local starts on its own** when this machine is the one you chose to
  answer: it is your active provider, or a row in the matrix is set to Main or
  Fallback. A chat that goes to a local model brings the server up if it is not
  running. Nothing points at this machine, nothing starts and no memory is used.
  **Start it on its own** at the top of the tab is the switch.
- **Rewrite a passage, not a whole answer.** Select any part of a reply, right
  click the selection, and the menu acts on the passage instead of the message:
  **Rewrite selection** first, then copy it, quote it, read it aloud or save it
  to a document. The gesture was already there and reached nothing; picking a
  paragraph out of a long answer no longer means retyping it after `/spin`. A
  selection dragged across several bubbles belongs to none of them, so the menu
  offered on each stays the one for the whole message.
- **Diagrams, drawn.** A ```` ```mermaid ```` block in an answer is now rendered:
  flowchart, sequence, state, class, entity-relationship, gantt, timeline, pie
  and xychart, in your accent and your theme, with the source one click away and
  a download as SVG. For a process, a structure or a comparison this is the
  cheapest good answer there is - four lines instead of a whole generated page -
  and unlike a page it is also the form a small local model gets right. The
  renderer is in the app; nothing is fetched.
- **Code blocks have colour.** Comments, strings, numbers, keywords and markup
  tags are tinted in every fenced block in the chat, in about fifty languages,
  using the same tokenizer the Code window's review panel already used. The five
  colours are measured against the surface they sit on rather than chosen by
  eye, and a gate holds them above the readable floor.
- **A page in an answer is shown as a page.** The chat drew a live preview only
  when the model wrote exactly `html` after the backticks. A block tagged `htm`,
  `svg`, `xhtml` or `html5`, or one that simply begins with a document, arrived
  as grey monospace - which is why the same answer from the same model was a
  drawn page on the phone and source code here. The rule is now the phone's, and
  a test compares the two so they cannot drift apart again. A snippet that
  merely mentions a tag stays code, and a `text` or `xml` fence is still the way
  to hand over markup you want to copy.
- **Skales knows what its own chat can do.** The system prompt described tools
  and providers and never the renderer, and the one sentence that said "put a
  page in a code block and it is drawn" sat in Code mode and nowhere else - so
  whether an explanation arrived as a picture or as three paragraphs came down
  to the habits of whichever model was answering. It now carries the live
  preview, the diagram, the formula and the colouring in every mode, with a test
  that checks each claim against the component that has to honour it.

- **A widget can be an application now, not just an answer.** Custom Widgets
  have been in Skales since v1, but a widget was an `execute()` function whose
  return value got drawn in one of four shapes - a gallery, a table, a block of
  HTML, or text. Nothing it produced survived being looked at twice, so the
  obvious thing to build, a notes app that keeps your notes, could not be built.
  There is now a fifth shape: a page you wrote, running in its own sandbox, with
  a store of its own. The four existing shapes are untouched and every widget
  built before this one still works exactly as it did.
- **The store a widget keeps.** A widget gets `window.skales.storage` with four
  calls - `get`, `set`, `remove`, `keys` - and that is the entire surface it gets
  from Skales. Deliberately not `localStorage`: that lives in the page's own
  origin, so it disappears when a cache is cleared, sits outside the folder a
  backup walks, and cannot be put back on import. This store is a file next to
  the widget's page, which means your entries survive a restart, travel in an
  export, and come back on the other side.
- **Widgets travel.** A backup now carries a `widgets/` section - the folder, the
  page and the store, per widget - and it is listed as mobile-compatible, so a
  widget built on the computer opens on the phone and back again. An import that
  brings a widget you already have never writes over it: the widget on this
  machine is left exactly as it is, the incoming copy is kept beside it, and the
  import names both. The store is your entries, and replacing it silently would
  be the expensive kind of quiet.
- **The house typography.** Twenty families across the six directions the design
  rules ask for - display, serif, grotesk, condensed, mono and script - now ship
  inside the app as subset woff2, and only the ones a page actually names get put
  into it. A generated page gets its typeface instantly, offline, and identically
  on both platforms. Naming a different Google family still works; the bundle is
  the guaranteed path, not the only one.

### Fixed

- **Analyze opens on the conversation you are actually in.** Clicking the spend
  bar under an answer, or the context readout under the composer, said there was
  no conversation to analyze - while you were sitting in one. Only the
  right-click in the session list worked, so the same conversation had a report
  by one route and nothing by the other. Both of those two ways in ask for
  "whatever is open right now", and the answer to that question was being read
  off a yes/no flag, which could never name a conversation. All three ways in
  reach the same report now.

- **Analyze and the figures under the answer are visibly the same numbers.**
  They always were: the first three parts of the bar are the input the provider
  counted, the last two are the output. Nothing said so, so a breakdown reading
  24k / 477k / 4.5k next to a bubble reading 501K in / 4.5K out looked like two
  different measurements with no way to tell which one to believe. The
  distribution now writes both totals out and says they are the same two
  figures.

- **A conversation that came in over WhatsApp, Telegram or Iris says why it has
  no figures.** It was being told it had been written before Skales kept usage
  figures, which for a conversation from this morning is simply untrue. A
  channel hands Skales a message and takes the answer back and reports no usage
  of its own; that is what it says now, and it names the channel.

- **The full-screen panels no longer sit on the window buttons.** Analyze,
  History, Group Chat and the rest opened flush against the top of the window,
  which on macOS is where the close, minimize and zoom buttons are drawn. People
  reached for what looked like the panel's own controls and quit Skales. The
  panels start below them, and so do the X and "Back to Flow" buttons in the
  Flow window, which were pinned four pixels from the same edge.

- **Port selection tests the address the server will actually use.** The check
  that walks ports 3000 to 3009 bound the loopback address while the server
  itself binds every interface whenever remote access or Swarm is on. On macOS
  those two can coexist, so the check reported the first port free, the real
  start died on it, and the nine spare ports were never tried. With remote
  access off it was the quieter half of the same fault: a second copy of Skales
  could take over the first one's address in silence.

- **The token readout under the composer can be read again.** Hovering it raised
  the operating system's own tooltip directly over the card carrying the exact
  figures, and the card could not be moved onto with the mouse. The tooltip is
  gone, what clicking does is written in the card itself, and the card can be
  hovered and its numbers selected.

- **The spend figures appear at the bar, not under the pointer.** The model line
  under an answer and the spend bar in the bubble explained themselves through
  the operating system's own tooltip, which is drawn about twenty pixels below
  the cursor and never beside the thing it explains. Both now open the same
  hover card the rest of the composer uses, anchored above the figure.

- **The whole context card opens the report it offers.** It ends with "click for
  the full report" and was the one part of the readout that did nothing when
  clicked; only the "... context" line underneath worked. The card is the button
  now, and the figures in it can still be selected and copied.

- **"Code" in the menu no longer glows.** It carried a ring that faded in and out
  every few seconds until the entry had been opened once, so on a machine where
  nobody opens Code it never stopped, and it read as a fault rather than an
  invitation.

- **The four Flow doors are one shape.** Lio AI, Studio Classic, 3D and Video
  Editor were laid out one, three or four across depending on the window width,
  with a title long enough on one of them to make it a different height from the
  rest. They are two by two, the same size, with the same amount of text. The Lio
  door is called Lio AI; what it does is the line underneath. 3D wears the beta
  badge alongside Video Editor, because it can do about as much.

- **The personality questions stop after one.** Five to seven "a quick question
  for you" cards could land in a single conversation, each with its own toast, and
  a card dropped into an old conversation while you were away marked it unread.
  There is one per conversation now and one announcement with it, the mark is
  gone, and the ordinary clarifying question the assistant asks while working -
  which is not this feature at all and was raising the same notice - is quiet.

- **A long conversation costs less to draw.** The spend breakdown behind each
  answer's bar was recalculated for every answer in the conversation on every
  redraw, and a conversation redraws on every word of an answer being written.
  It is worked out once per answer now.

- **The chat typeface reaches the answer, not only your own message.** Choosing
  a face changed the text you wrote and left everything Skales said in the
  default one, which made the setting look half-broken. An answer that carries
  reasoning - which is every answer from a thinking model - was drawn outside
  the place the choice applies. Both kinds of answer follow it now, at the size
  that belongs to the face. The reasoning lid deliberately stays in the default
  face: it is not the answer.

  The same setting was still stopping at your own message whenever the answer
  had run a tool, which in practice is most answers: an answer with tool results
  and an answer waiting for approval are drawn by a different piece of the chat,
  and neither of them knew about the choice. All of them follow it now. The size
  is a multiplier, so no bubble is allowed to sit inside a second one and apply
  it twice.

- **A designed page that animates in is visible even when the animation never
  starts.** A poster or a visual is usually written to fade and slide into
  place, which means every element begins at zero opacity. When whatever was
  supposed to bring them up did not run, the result was not a page missing its
  motion - it was a blank rectangle, impossible to tell apart from a page that
  failed to generate. Every page is now watched as it opens: if nothing at all
  is on screen shortly after it loads, its opening is triggered a second time,
  and if it is still empty after that, it is shown in its finished state. Pages
  made earlier are covered too, because the check happens when a page is shown
  rather than when it is written.

- **A question in the Code window is answerable again.** A question with no
  options to pick from drew no field at all, and the send button demanded a
  choice for every question - which a free-text question can never give - so the
  card sat there greyed out and the composer was the only way past it. There is
  now a proper field wherever there is nothing to pick, every option list ends
  in a "Something else" escape with a field behind it, and a typed answer counts
  as an answer. With more than one question on the card, the footer says which
  one the number keys are currently pointing at and that question is marked, so
  a 2 is never a guess. The composer still answers everything, as before.
- **The answer to a question card looks like the answer to a question card.**
  What you picked used to come back as a numbered list in a plain message
  bubble, so the question was a card and the reply to it was a paragraph. The
  reply now draws as the pair to the card, one row per question with the choice
  under it. Nothing changed about what is sent: the model still receives the
  questions and answers in full, in plain text, which is the only record of the
  exchange once a conversation has been compacted.
- **Shell survives every tool budget.** On a local model, `execute_command`
  could be trimmed out of a turn while the first line of the system prompt still
  promised a shell, so the model reported - accurately - that it had no shell
  tool. The shell family is now protected alongside the file tools, and the
  Shell line only appears when the tool was actually sent.
- **A local model is no longer planned against a window four times too small.**
  The per-turn budget assumed 8192 tokens of context for any local runtime, even
  though LM Studio reports its real window and a custom endpoint was not in the
  table at all. Measured on the same catalogue, LM Studio went from 7 tools per
  turn to 88 and a custom endpoint from 7 to 120. A real rate limit still binds:
  a key on an 8000-tokens-per-minute plan is planned for exactly as before.
- **The trim note points at the setting that did the cutting.** Three different
  limits can shorten the tool set and the note always named the local-model
  slider, which changes nothing for two of them.
- **The IMAP account test works.** Testing an account against a server that
  sends folder names in modified UTF-7 (Yandex among them) failed with
  `allocateBase64Buffer is not defined` from inside a minified chunk. The
  library it comes from is written for plain CommonJS and was being bundled into
  a strict-mode chunk, where the helper it needs stops existing. It now loads as
  what it is.
- **The IMAP and SMTP test buttons always answer.** A server that accepted the
  login and then went quiet left the button spinning with no error and no
  result; both now stop after 45 seconds and say what happened.
- **A custom agent no longer runs on a model its provider does not have.** An
  agent that stored a model id while one provider was active kept it after a
  switch, and the id travelled to an endpoint that never heard of it. The stored
  id is now checked against the provider's own catalogue, and only a catalogue
  that actually answers can replace it.
- **Skales Local failures say what they are.** A local server that is not
  answering, a machine that ran out of memory loading a model, and a model that
  cannot read images are three different sentences with three different next
  steps, instead of a transport error.
- **AIPointer's switches are reachable by keyboard and named for a screen
  reader.** They were neither.

- **A goal now remembers the files it produced.** The ledger has always had a
  place for them and nothing ever wrote one, so the list was empty everywhere it
  was read: the checker's evidence, the "Produced:" line of a distilled strategy,
  and the durable half of the did-any-work test. A run could write a file, have
  its raw turns compacted away, and then have nothing left that remembered the
  file existed. Every successful write is recorded on the goal now.

### Changed

- **Code in a chat takes its colour from the theme.** The dark surface behind a
  code block was written into three separate places as a fixed value, so no
  theme could reach it. It is one setting now, next to the five colours the code
  itself is written in - and those five are measured against it, so a theme that
  moves the surface cannot leave the text unreadable on top of it.

- **Interests and mood moved to Settings, Memory, and what they learn is
  visible.** The switch sat in General under a heading about units and the
  weather, and the settings search could not find it: looking for "emotion"
  returned nothing. It is a section of its own under Memory now, where it
  belongs, and the Memory page shows every topic Skales has noticed, how often
  it came up and which narrower part of it recurred. Each one can be deleted on
  its own, all of them at once, and the mood and the working history each have
  their own reset. Deleting is real deleting: a removed topic only comes back if
  it comes up again. A memory you can neither read nor erase is not a feature.
- **The chat's popups open full width.** Agents, Group Chat, Teams,
  Organization, History, Projects and Add-Ons opened into a dialog the width of
  a document, which is about half of what a team roster or an org chart was
  drawn for. They now open in the same frame the Cockpit uses, and History is
  one of them rather than a navigation away from the conversation. The width
  comes from the host, so the same screen reads full width in the popup and as a
  document on its own route.
- **One interface, from one place.** Over several passes the app finished a
  consolidation that had been running for a while: every toggle, select, slider
  and API-key field now comes from one shared component, the small font sizes
  have names instead of arbitrary pixel values, status colours and accent
  colours come from tokens so all six themes are correct, every document page
  shares one content width, and window chrome and the brand typeface are the
  same on every surface, including the splash, error and OAuth screens. Studio
  speaks the same base as the rest of the app again.
- **Two switches showed two states at once.** A stylesheet rule left over from
  an older kit drew a second, fixed knob under every shared toggle; on, the two
  drifted apart.
- **Slider legends sit on their real value.** A three-mark legend was spaced
  evenly regardless of the scale, so "5 min (default)" sat in the middle of a
  one-to-sixty-minute track where half an hour actually is, and the last mark
  stood past the end of the track it labelled.
- **One background per surface.** The chat landing page, Wrapped, the DevKit
  docs page and the sidebar popup each laid a second background over the app.
- **Clean up under Skales Local actually deletes.** It skipped anything that was
  not a file and reported success.

- **Model-written pages have a stated network posture, and it is the same one on
  both platforms.** The preview iframe in chat had no content policy at all, so a
  generated page could load from anywhere. It now carries one, and it allows
  exactly the three places the generator prompts themselves point at:
  `cdnjs.cloudflare.com`, Google Fonts, and `images.unsplash.com`. Everything
  else is refused, and the refusal is printed on the page with the address that
  was tried, rather than failing as a blank space that reads like a bug in the
  page. A Custom Widget gets a stricter posture still: no network at all, on
  either platform, so a widget behaves the same wherever you open it.
- **The widget builder can build the new shape.** Widget AI now knows about pages
  with state: it is told the four storage calls, that it has no network, and
  which typefaces are already loaded. Rebuilding a widget keeps its folder, so a
  rewrite of the page is not a way to lose the entries you had.

## v12.8.0 - Sightline

The sidebar is one list again, the surfaces that had grown into a menu of their
own are back where the work happens, and what Skales knows about you can be kept
off the network with one switch.

### Added

- **One sidebar, and it belongs to what you are doing.** Home lists Dashboard,
  Chat, Code, Studio, Cockpit, Planner, Iris, Memory, Mobile, then Discover and
  Wrapped, then System. Open a conversation and the same column becomes the
  chat's own navigation: New chat, Agents, Cockpit, and a More group holding
  History, Projects, Teams, Group Chat, Organization, and Add-Ons and Skills.
  The shortcuts open as overlays over the same screens the routes show, each
  with its own title bar, so nothing sits under the close button any more.
- **Cockpit: everything that is running, in one place.** Goals, Tasks and
  Schedule as three tabs of one screen, with the tab in the address so a reload
  brings you back where you were. Goals has a screen for the first time: what
  each goal is trying to do, the criteria it must meet and the evidence it has
  collected, its last steps with the tool each one used, what it produced, what
  it learned, and what it has spent, with Open, Continue and Stop on each one.
  Finished goals are listed too, and so are the ones on a repeating schedule.
- **Studio opens Flow.** Clicking Studio puts you straight into the workspace
  in its own window instead of a screen asking which half you want. The whole
  of the older Studio is still there, one door below the composer as **Studio
  Classic**, on the tab you were linking to, with a Back to Flow line at the
  top of its rail. A second door starts a prototype in Lio AI, and that page
  has its way back too.
- **Planner has its own entry again.** It is the one visual calendar surface
  and it survives a fresh install.
- **A Codework mode in Code.** A pill in the composer starts the session with
  the file and preview panel and the review panel already open, so the chat,
  the files and the diff stand side by side from the first message. Pressed or
  not pressed is remembered like the terminal and the panel widths, and it
  shapes a session when it starts rather than rearranging one mid task.
- **Code takes a typed project path,** so a folder can be opened without the
  native picker, and the server validates it the same way either way.
- **Code drafts its own commit message.** A Draft message button beside Commit
  reads the staged diff and writes the message; a repository without a first
  commit is handled rather than failing on a missing HEAD.
- **Chat and Code can see your Projects,** and can keep their own working notes
  in one instead of scattering scratch files.

### Changed

- **Privacy Mode: what Skales remembers about you never leaves the machine.**
  One switch. With it on, a cloud model gets no memory index, no name, no
  facts, no preferences, no interests and no learnings, and the prompt says
  plainly that a memory exists and is being kept local rather than pretending
  there is none. Your language and the clock survive, local models are
  unaffected, and the background briefing follows the same rule. Which
  provider counts as local is decided by the address it points at, never by
  its name, so a custom slot on a rented endpoint is treated as the cloud it
  is.
- **The prompt is budgeted before it is sent,** so a model with a small context
  window is given a tool set it can actually hold instead of one that pushes
  the conversation out, and it is told what is not currently loaded rather than
  being left to guess.

### Fixed

- **A goal is only finished when its criteria are met.** The chat used to be
  able to write a goal off as done past the gate the runner honours. Both paths
  go through the same gate now. Accepting a result may overrule the criteria,
  but never a sub task that is still running, and a refused accept leaves the
  goal parked and says on the card why.
- **A completion marker never appears in the answer.** The word the runner uses
  to signal it is finished is stripped from what you read, on every surface.
- **Updates that stall say so.** The updater notices a download that stopped
  moving instead of leaving a progress bar sitting at a number forever.
- **Unsloth Desktop, and every other provider, gets the address it documents.**
  Fetching models from a cloud provider whose default address carries no path
  appends the version segment those providers resolve to anyway, and the bare
  address is still tried second. A conformance check now walks the whole
  provider registry so one card can no longer build its URL differently from
  the rest.
- **The Obsidian theme has all of its menu.** Its dropdown had been dropping
  every entry that was not in a group, which since the sidebar was rebuilt
  meant Agents, Tasks, Schedule and Notifications had no door at all.
- **Settings opens on the section a link names,** instead of landing at the top
  of the page and leaving you to find it.
- **New chat no longer reloads the history list** every time it is pressed.

## v12.7.45 - SKLS

A repair release, built the day after 12.7.4 from what the first devices
reported. The local server that the release was named for now answers on the
machines it was promised to, and a handful of screens that guessed, hid or
misnamed their failures say what actually happened instead.

### Added

- **Unsloth Desktop is a provider with its own name.** It has a tile in the
  provider grid with the same on and off switch every other provider has, an
  address already filled in, and a button that finds a running instance on
  either of the two ports it uses. It is the first local runtime that wants an
  API key, so the card says where that key is made, and a refused key is
  reported as a refused key instead of as a missing model. Refresh Models reads
  the runtime's own GGUF catalogue with the quantisation of each file, and a
  model that is still loading gets the long silent window a local runtime needs.
  How long a model stays in VRAM is set inside Unsloth Desktop, and the card
  says so rather than showing a control that would do nothing.

### Fixed

- **A turn to the local server carries a local model id.** Switching to Skales
  Local kept the previous provider's model id, so the runtime was asked for
  "openai/gpt-5-mini" it could never hold. Both request paths now resolve the
  id from the capability matrix, the provider card or the runtime itself, in
  that order, and a request to a local address can no longer carry another
  vendor's id.
- **The Mac build for Apple Silicon carries the local server.** The arm64
  package held 253 MB of engines for three other platforms and none of its
  own. Each platform and architecture now stages its own engines, a build
  gate measures the staged files against what the configs promise to ship,
  and every bundled library had its build-machine search path repaired, not
  just the executable. Mac packages shrink by the foreign payload they no
  longer carry.
- **Fetch Available Models sees what the runtime holds.** The fetch button
  knew one URL and two answer shapes while the error path knew two and three,
  so the card said "0 models" while the chat error listed all of them. One
  reader serves both now, the card offers its own library without a button
  press, and projector companion files no longer appear as answerable models.
- **Models on another disk are found.** Detection read two default folders on
  the system drive and called the rest of the computer empty. It now reads
  Ollama's configured model path including the Windows user environment, LM
  Studio's own settings, and asks running runtimes what they hold; an empty
  scan names the folders it read and offers picking one instead of claiming
  absence.
- **One status line, one Start now.** The Skales Local card rendered two
  answers to "is it running", one of them with a dead start button when no
  model was installed. One resolver decides, and the more concrete answer
  wins.
- **Connecting a Google account survives its own landing page.** The return
  page re-ran its effect the moment translations finished loading and burned
  the one-time code, which read as "This authorization is no longer open"
  seconds after a successful consent. With remote access on, the final step
  was rejected as unauthenticated and surfaced as a bare "Failed to fetch".
  The landing step is reachable on its own now, the code is claimed before
  the exchange, a run lives an hour, and a second tab can no longer erase
  the account the first one connected.
- **A tool that is named can be called.** The capability answer listed tools
  from the catalog that the running turn had not loaded, and the model,
  unable to find them, tried them as shell commands and invented an excuse
  when that failed. Naming now loads, a tool name typed as a shell command is
  steered back to the tool instead of executed, and the answer says how a
  not-yet-loaded tool becomes callable.
- **Credentials stay out of transcripts.** The integrations folder is sealed
  against file tools the way settings.json already was, and web requests
  redact tokens and secret fields by name in what they log and store.
- **Calendar reads with your account, not just your key.** With both an API
  key and a connected account, events were fetched with the key alone, which
  can only see public calendars and read as "google rejected access". A
  rejected fetch retries once with the account token, and writes always use
  credentials that can write.
- **Saved keys stop eating themselves.** Twenty fields showed a shortened
  key prefix after saving, and saving again wrote that shortening over the
  real credential, after which every check failed. A saved secret shows as
  dots that are never written back.
- **Replies to bug reports arrive.** An answer from the maintainer was
  fetched and thrown away by the notification poller, unclickable on the
  notifications page and invisible on the feedback page. It now surfaces in
  all three places.
- **Searching Settings finds every line again.** The 12.7.4 rule that let a
  section-name match win outright also erased every inventory match, which
  made "Google" unable to find the Google account setup inside Productivity
  Integrations, and the same for 144 other word-to-section pairs. Name
  matches sort first now, everything else follows under a divider, and a
  test probes every word of every section name and keyword against the index.
- **A turn that ends with nothing says what ended it.** A dropped connection,
  a filtered answer, an output limit reached before the first word, a reply
  spent entirely on reasoning and a genuinely empty answer all ended in the
  same sentence with no log line, and the retry button only existed in
  English. Each cause has its own sentence in all twelve languages, one log
  line names it on the server, and the reason and retry survive a reload.
- **Post generation stops calling a token limit a timeout.** Discover's
  compose gave every model 120 tokens; reasoning models spent them thinking
  and never wrote, and the empty result was labelled "your model did not
  answer in time". The budget starts at 1024 and climbs before reasoning is
  switched off, an answer cut at the limit is named as cut, and a fallback
  template says why it is one.
- **The diagnosis stops blaming the outside for a stop Skales ordered.** The
  server exit recorded as an external SIGKILL during Discover traffic was
  Skales's own five-second shutdown grace ending a long request; measured,
  not guessed. The forced stop marks itself and the diagnosis names it. The
  same report also claimed crash recording was off while it was on; the
  answer now comes from the installed handlers instead of an env guess.

## v12.7.4 - Skales Local

A release about screens that tell the truth. A connection that worked but read
as broken, a tool that was announced and could not be called, a question asked
by the operating system in a way that left the window unusable afterwards. Five
copies of the same answer do not make it true, so there is one of each now.

### Added

- **A Telegram bot in a group can be told when to speak.** It answered every
  message in the room, which is fine where the room is built around it and
  unusable where people are talking to each other. Settings, Integrations,
  Telegram now offers every message, only when mentioned or replied to, only
  replies, or only commands. Every message stays the default, so nothing changes
  for a bot that works today. Any single chat can be muted without unpairing it,
  and a group that pairs from now on can start muted and is told so when it does.

- **Skales ships its own server.** Skales Local is a provider like any other
  in the list, with one difference: it asks for no key, no account and no
  install. The inference server lives inside the app. A new Settings tab
  carries the models, with search, categories (language, seeing, voice, image,
  imported, downloaded) and sorting by size, name or last used.
- **Four capabilities, four separate decisions.** Chat, dictation, read-aloud
  and images can each be set to this machine first, cloud first, or off.
  Images local, voice local and the language model through OpenRouter is an
  intended combination, and so is every other one, on every surface that
  needs a model.
- **Whoever answers is named, before and after.** The model line above the
  composer reads "Skales Local" and the model with it, so the choice can be
  checked before a word is sent. Set a capability to this machine first and it
  is never quietly pulled into the cloud. When a turn does have to leave the
  machine, the answer carries the reason; when neither side can answer, there
  is a sentence and a next step instead of a spinner.
- **Fetch a model, bring your own, or adopt one.** The download shows real
  progress, resumes where it stopped, and checks the file against its checksum
  before it counts as installed. A repository that wants a licence confirmed
  first says exactly that instead of "download failed". Your own .gguf, .onnx
  or .safetensors files come in through the file picker, and existing Ollama
  and LM Studio folders are recognised and used where they lie: the disk pays
  once. A file that is part of a model rather than a model - a projector, an
  autoencoder, a text encoder - is recognised as one and shown as one, so it
  never turns up in a list of models to answer with.
- **Dictate and listen with no network.** Whisper for hearing, VITS voices for
  speaking, both through one runtime and one install shared by Chat, Iris and
  AIPointer. Ten of the twelve interface languages have a voice, Croatian
  among them. Japanese and Korean have none we are allowed to ship, and the
  screen says so.
- **Pictures that never leave the machine.** The local image model sits behind
  the same tool as before, in Chat, in Studio and in Flow, as a backend and
  not as an island of its own. Skales reads the graphics chip's report first:
  if it cannot run the needed kernels, the picture runs on the processor,
  named, instead of crashing.
- **Every licence is in the app.** Settings, Advanced, Third-party notices:
  the open-source components and the terms of every local model, full texts,
  offline and searchable. A build that is handed a catalog model without its
  licence does not pass.

- **The sidebar becomes the chat's own navigation.** In a conversation, on the
  themes with a full sidebar, it shows New, Agents, Tasks and Add-Ons & Skills
  as overlays over the same screens the routes show, and below them the history,
  grouped by day, pinned chats first. A row says what its chat is doing -
  running, waiting for an approval, failed, a goal met - and keeps saying it
  after a reload, because the state is written to disk. A chat that came in over
  WhatsApp, Telegram, the phone or a task wears that channel's mark; everything
  else wears a quiet bullet. Hold still on a row and it gives you the date and
  time; pass over it on the way somewhere else and it stays out of your way.
  Home and Work stay on top and are the way back.
- **Setup names the three ways in.** Skales IQ, Skales Local with what it
  costs on disk and its Beta label, or your own key.

### Fixed

- **One dialog asks every question.** Deleting a chat on Windows put up the
  operating system's own box, and after it closed the composer was dead until
  you switched windows and back. Sixty-four of those calls across the app are
  now the Skales dialog, in every window, and the keyboard goes back to the
  button you pressed.
- **A ChatGPT subscription reads as connected, because it is.** The status card
  asked one question and the chat asked another, so a paid account that answered
  every message was reported as no provider at all. GLM and Qwen were read and
  never mentioned. There is one predicate now, and a new provider card lists
  itself.
- **Skales stops calling twelve of its own abilities switched off.** The
  self-report looked them up under a name the settings page does not write, so
  the answer was silently no. Places, Planner, Teams, Extensions and eight more
  now report the switch they actually have.
- **Drive, Docs, Calendar and YouTube can be called when they are configured.**
  They were announced as active and then were not in the toolbox, because the
  announcement and the catalogue read different files. Calendar was the same
  mistake one step worse: a machine with only an Apple or Outlook calendar had
  no calendar tool at all.
- **Connecting a Google account no longer paints an error over the success.**
  The landing page finished the exchange a second time and reported that the
  authorisation was closed, on top of a connection that had just worked.
  Disconnecting it has an exit too: a request that is dropped rather than
  refused used to leave the card waiting for ever, and a delete that failed
  still said the account was gone.
- **GigaChat can use tools on both of its hosts.** The current one refused the
  follow-up request because a tool result was sent as raw markdown where it
  wants JSON. The older one has no tools field at all, so the tools travelled
  there and were discarded before the model saw them; it now gets the contract
  it publishes. Model lists belong to the host that offers them, so the endpoint
  you selected stops offering a model it answers 404 for.
- **A tool call written in any script is recognised as a tool call.** The
  recogniser was a list of known markers, and a list only grows after somebody
  reports what it missed. It asks a structural question now, so a block in
  Arabic or Cyrillic is caught the same as one in English, and a fenced example
  is still left alone.
- **The Google Places hint names the API that is actually called**, which is
  Places API (New) and not the older one with almost the same name, and the card
  has a test button that hands Google's own answer back word for word.
- **Pressing Try again after a crash reloads instead of remounting.** The
  retry rebuilt the router inside a document that had already lost it, so
  /profiles and /settings answered a crash with the same crash, three times in
  three seconds.
- **Notifications stop appearing under the window buttons** on Windows, and the
  full-screen close button in Studio moves out from under the system one.
- **A tool that cannot work stops being asked again.** A missing browser, a
  search that hit a bot challenge, a path that is a folder: those were retried
  five and nine times a second with slightly different arguments. The failure
  now says whether it is worth another try, and the runner listens.
- **A tool name mangled by the model resolves to the tool it meant**, instead of
  being reported as an unknown one.

- **A local model could end up in the cloud without anyone saying so.** Four
  places outside the chat path ended their provider chain at a paid service
  when they did not know the configured provider: Autopilot, Lio and two of
  the background runners. An unknown provider is a named error now, not a
  silent detour, and the hard-coded paid default is gone.
- **Agents, Flow, Studio and Lio ask the same place the chat asks.** All four
  used to decide on their own which provider answers, and Flow's fall-back to
  a cloud-only list happened in silence. They go through the same resolution
  as everything else now, and Studio's Auto names the model that actually
  answers.
- **A downloaded model is also found.** The downloader wrote into a folder the
  server never looked at. One folder for both.
- **The machine may sleep.** A generation that runs into system sleep is
  called sleeping now instead of nothing; on waking, Skales probes the server
  and only restarts it when it has really lost it.

- **The chat page outlives a long answer.** After minutes of an unanswered
  turn the page could be replaced by a crash card, React's error 482. The page
  was suspending its own router: every timer on it polled through server
  actions, and each of those parks the router on an unresolved promise. The
  timers poll over plain requests now, and the seven-minute watch that used to
  die in the fifth minute runs through with the honest timeout line still on
  screen.
- **A Telegram answer belongs to the chat that asked for it.** When two chats
  wrote at the same time, one could be handed the other's answer, pictures and
  even an approval keyboard included. The answer is picked by chat now, and
  the bot refuses to post one addressed to another room.
- **Iris's mute button leaves the window buttons alone**, and muting her means
  she stops listening, not that she stops talking: the microphone closes, the
  sentence finishes, and the choice survives a restart.
- **Opening Iris no longer announces anything.** She does not greet you, she
  listens. Same as on the phone: the window opens, the ear is ready, and the
  first sentence in the room is yours.
- **The floating Save button no longer covers the end of a settings tab.**
- **The size on a model card is what the download really costs.** A model that
  can see is fetched together with the file it sees through, and the card
  counts both. The description sits behind the card's own chevron, so the
  list stays a list.

### Changed

- **An image that goes to another model says so.** The routing was right and
  invisible: a picture handed to a model that can see it was a console line and
  nothing on screen. The conversation now carries a line naming the model, and
  says explicitly when the image left the machine.
- **A pairing that fails against an old desktop says which versions are
  involved**, on the phone, instead of fifteen silent seconds. The confirmation
  dialog on the desktop shows the phone's version too, which is the one dialog
  where the owner had no way of seeing what was asking.
- **The Agents page asks before deleting the way everything else does.** Its
  second-click-within-four-seconds pattern was built to avoid the operating
  system dialogs that this release removed.

## v12.7.3 - Drop-In

A release about being answered. A local provider that would not talk, tools
that reported more than they did, and a call you can now interrupt in the
middle of a word.

### Fixed

- **LM Studio answers again.** The provider card said no API key was needed and
  every message came back asking for one. The guard in front of the chat kept
  its own list of the providers that need none, and had never been told about
  LM Studio. That list is now written once and asked from everywhere.
- **The LM Studio card's Refresh Models button exists.** Its own hint told you
  to press it; the button was never drawn, and the model list behind it was
  refused for want of a key it never needed. A running LM Studio now shows up
  in the model picker, in model search, on the Agents page and in the provider
  grid, and an agent pinned to it stays pinned.
- **A group chat can be pointed at your own OpenAI-compatible endpoint**, and
  the group-chat skill runs on a local model with no key at all.
- **A failed Windows update leaves a trail.** Every step of the update path is
  written down with a timestamp, and the last lines of it ride along in
  Settings > Advanced > Diagnostics. The app also stops quitting on a timer
  while the installer is still starting: it waits for the installer to actually
  be there, and says so when it is not.
- **A failed send is explained the way a failed test is:** the mailbox that
  refuses your password says which credential it wants and where to get it, on
  every mail action rather than only when you press Test.
- **A mailbox that cannot be opened no longer answers under the name you asked
  for**, and a list that was shortened says that it was shortened. Emptying the
  trash reports what it deleted, not what it found.
- **A calendar that could not be read says so** instead of shortening your week,
  and a week with no calendar connected no longer reads as a free one.
- **Speech, images and video stop claiming more than they did.** A voice that
  fell through to a free fallback says which provider refused and why; text that
  was too long to speak says it was cut; a video job that failed says it failed
  instead of going quiet after "started"; and a provider that answers 401, 402 or
  429 is named as your account rather than as a fault in the app.
- **There was a second copy of the speech cascade**, and the two had drifted far
  enough that the same settings produced two different voices. There is one now.
- **A file too large for the phone is refused before the connection breaks.**
  The ceiling was set by an estimate that counted one round of encoding; it is
  now the measured number, written down once for both file paths.

### Changed

- **Talking over Call Mode interrupts her mid-word.** Call Mode used to stop the
  audio only after the sentence had finished. It now listens through playback
  with the same calibrated listener the Iris window uses, and hands the turn
  back to you as soon as you start speaking. Where the microphone cannot be
  opened for it, the old behaviour stays and the screen says why.
- **Iris uses your name the way a person does:** once at the start of a
  conversation, and after that only when she is actually addressing you.
- **Qwen 3.7 gets a profile of its own:** the thinking-mode sampling the vendor
  publishes instead of the generic Qwen profile's non-thinking numbers, and a
  long-thinking budget so a silent stretch is not cut off as a stalled stream.
- **The guide has its first screenshots**, and the LM Studio and KoboldCpp setup
  pages have caught up with the provider grid that replaced the old dropdown.
- **The acknowledgment that fills the silence follows where your endpoint
  actually points**, not what it is labelled. A custom endpoint on the internet
  is treated as being on the internet; one that cannot be read at all stays
  silent, as before.

## v12.7.2 - Cockpit

A release about seeing what is going on. What is running and where, what a
conversation is costing, what a tool actually did or did not do, and what the
model wrote when it meant to call one.

### Added

- **Autopilot opens on what is in flight.** Goals, runs, tasks and scheduled
  jobs stand in one list, each as a single line saying what it is, which
  surface it is on, which model is answering, when it last moved, and the one
  thing you can do with it. Code sessions working in the background appear
  there too; no screen showed them before.
- **A Code session can carry a goal.** `/goal` in the Code window arms the same
  ledger the chat uses, and a strip above the composer shows what the session is
  working towards, how far it has got, and whether it is running, waiting for
  you or on hold. It survives a restart, so a coding task can be followed over
  days rather than a sitting.
- **Sessions have addresses.** A model can list your other conversations - title,
  surface, model, open goal - and leave an unread note in one of them. It starts
  nothing over there and spends nothing. An isolated agent can do neither, and
  the refusal sits in the tool itself rather than in whoever called it.
- **A long conversation offers to carry on somewhere fresh.** When a conversation
  has really grown - several exchanges, and the size spread across them rather
  than sitting in one enormous turn - the chat says how much history it is
  carrying and what a new session with a summary would start at. It only ever
  offers. Nothing is deleted, and nothing is spent without you saying so.
- **An available update stays visible until you deal with it.** A pill in the
  window chrome, fed by both the updater and an announcement from us, instead of
  a toast you had to be looking at for five seconds. Hiding it is remembered
  until the next version, and it goes away by itself once the update is in.

- **WordPress can do what your site can do.** Skales reached about a third of a
  WordPress site before. Now: find, read, change and delete posts, the media
  library, categories and tags, comment moderation, menus and widgets, colours
  and fonts, the logo, site settings and permalinks.
- **The featured image finally gets set.** "Write a blog post and add a fitting
  image" used to put the picture in the body only, and the thumbnail your theme,
  your post list and every WhatsApp or LinkedIn preview shows stayed empty.
- **The phone reaches the cockpit.** The session directory, everything in
  flight and how to stop it, a coding session's goals, the handover, and
  leaving a note in another session. It can also open a coding session's file
  tree and read a file out of it.
- **Something is said while the model is still thinking.** A big model can sit
  silent for several seconds before it writes anything, and a pulsing dot in
  that window reads as broken. One short line now says what is about to happen,
  in your language, and disappears the moment the real answer starts. It is
  never stored and never sent back to a model on a later turn.
  Who writes that line follows where your conversation already goes: on Skales
  IQ it comes from Skales and says so; on your own key it comes from a small
  cheap model at the same provider; and if you run a local model it stays on
  your machine or does not happen at all. One switch, in Settings under
  Chat & Code, Assist, turns it off everywhere.
- **A team run shows up in the list of what is going on.** A team of agents
  working through a task was the loudest thing in the product that appeared on
  only one screen. It has a line now, with the stop button the other rows have.
- **Sub-agents can be given a role.** A dispatched sub-agent inherits every tool
  in the catalogue and pays for the whole list on every turn. Eleven roles have
  existed for a while with no way to reach them; there is a setting for them
  now, and it still starts on the old behaviour.
- **The cockpit says when a hand-off is worth taking.** The phone can see it
  too: how much history a conversation carries into every turn, and what a fresh
  session on a summary would save.

### Fixed

- **The nightly identity upkeep stops looking in the wrong place.** The built-in
  3am job that keeps what Skales knows about you up to date was pointed at its
  memory folder by a relative path, and every night it landed in the program
  directory instead: two red lines in the log, and the half of the job that
  reads your recent memories never read anything. It names its folders outright
  now. The same slip was in the file tools underneath it - listing or creating a
  folder by a short name went to the program directory while every other file
  tool went to your workspace - so they agree now too.
- **Skales answers questions about itself from its own manual.** Asked what a
  setting does, it used to go rummaging through its own program code: thirteen
  tool calls and a very expensive turn for an answer three sentences long, and
  on a normal installation that code is not even there. It reads the guide, the
  changelog and its capability list, and if the answer is in none of them it
  says so rather than going digging.
- **The invitation to send feedback waits until you have actually used the
  desktop app.** It only asked how old the installation was, so somebody who
  installed Skales on their computer, worked on their phone and never opened the
  desktop window got a form three days later asking what was missing.

- **Mute now means mute.** Switching notifications off silenced everything
  except the messages Skales considered important, which is how two reminders
  arrived at ten to midnight with the switch on. Nothing goes out on any channel
  now, and nothing is swallowed either: what was held back waits on the
  Notifications page, and a line at the top says how many important ones there
  were.
- **One meeting, one reminder.** Three parts of Skales reminded about calendar
  events without knowing about each other, so a single entry could ping you
  twice. Whichever gets there first now owns the reminder for that event that
  day, and tomorrow's occurrence of a recurring entry reminds again as before.
- **Friend Mode switched off also stops Skales taking the initiative.** The
  proactive assistant had its own switch buried on the Notifications page, so
  turning the companion off left it running and it kept surfacing meetings and
  overdue tasks.
- **An approval request obeys the mute too.** It went straight to Telegram and
  never asked, so it was the one ping a muted user still got.
- **Unchecking every notification channel now actually means silence.** A
  last-resort system notification still went out, because it could not tell
  "the channel you picked is unreachable" from "you picked none". The first one
  still gets the fallback; the second one gets the Notifications page.
- **A tool call the model wrote as text no longer becomes the answer.** In any of
  the shapes models write it in, including the ones that are not in English and
  the ones that look like a line of Python. A call whose name just missed a real
  tool is now corrected in the conversation instead of being dropped in silence,
  and the same correction reaches Telegram, WhatsApp and the CLI, not only the
  desktop window.
- **Personas report a failed tool as a failed tool.** Inventing a plausible
  result was the most expensive thing any of them did.
- **A provider error says which provider, which status, and what the provider
  itself said** - in every language. The detail used to be attached to the
  English sentence and then thrown away by the translation.
- **A refused page stops being reported as a page.** `fetch_web_page` and
  `extract_web_text` lead with the HTTP status and say in words when what came
  back is a server's error page. A PDF, an image or an archive is refused by
  name instead of being run through the HTML strip and handed over as text.
- **Web search says whose problem a failure is.** A rejected key is a rejected
  key, a spent quota is a quota, and a provider having a bad day is that. The
  SearXNG hint about JSON output only appears on the status that actually means
  it.
- **A file tool says which argument it is missing,** and accepts the argument
  names models really send. A well-formed call carrying `contents` or
  `file_text` used to fail where a malformed one carrying the same key was
  repaired.
- **A write that wrote nothing leaves nothing behind.** No folders, no backup
  file, and an existing file untouched.
- **A full disk reads as a full disk** in every file tool, not as an errno line
  in five of them.
- **A signed-in ChatGPT, Claude or Gemini subscription is stored the way an API
  key is stored.** The token that signs you in sat in the settings file as
  readable text next to keys that were encrypted; it is encrypted now, and an
  existing sign-in is converted the next time Skales starts.
- **A schedule that switches itself off says so.** After three failed runs a
  schedule pauses itself, which was right - but it only wrote a log line, so a
  nightly job could simply stop happening and nobody found out.
- **The phone stops waiting for an answer that was never coming.** Two of the
  requests it makes about a coding session could end without a reply at all, so
  the phone sat out its timeout and then blamed the computer instead of naming
  the reason.
- **Listing a folder no longer empties the context window.** The listing is
  capped, says how many entries there are in total, and no longer holds up every
  other conversation while it counts.
- **A big image no longer breaks the automation.** A generated picture used to
  travel through the model as one enormous block of text before it was uploaded;
  Skales reads the file itself now. That is where a scheduled overnight run used
  to stop.
- **SEO is read before it is overwritten.** And when the site is set to
  discourage search engines, Skales says so instead of reporting SEO nobody will
  see.
- **A refusal names what is missing.** If the connector hangs on an account with
  limited rights, Skales says which right is missing on which account. And when
  a design change would do nothing in the active theme, it says that instead of
  reporting success.
- **A signed-in ChatGPT subscription starts on the general flagship** instead of
  the Codex coding model, and the account's own model catalogue is asked for
  rather than assumed.
- **Google says why it refused:** a location it does not serve, a rejected key,
  an API that was never switched on, or an exhausted quota, instead of one
  blanket "check your settings" for all four. The same refusal from OpenAI and
  from a ChatGPT subscription reads the same way, in every language.
- **The chat model picker lists the active provider's models straight away**
  instead of waiting for a search term, and an install with no provider set up
  is told that, rather than pointed at a search box with nothing behind it.
- **The CLI routes that manage MCP servers ask who is calling.** Four of them
  did not: one handed out the stored server configuration including the linked
  server's keys, one deleted a definition, and two started and stopped the
  configured process, for anyone who could reach the port. The DevKit token is
  now compared the same careful way as the API token beside it.
- **A command that fails says how it failed.** The exit status travels with the
  answer, so a search that found nothing reads as nothing found rather than as a
  broken command, and a program that is not installed says that instead of
  blaming the command. Output too large to read back is reported as a command
  that ran with its output cut, not as one that never happened.
- **A shell tool with nothing to run says which argument is missing** instead of
  answering with an internal error, and the same goes for the browser: no
  address, no target to click, no key to press. A scroll direction the browser
  does not have is refused rather than quietly scrolling the other way.
- **A page that was not there stops being read as a page.** When a site answers
  404, 403 or 503, the browser says so before the error page's own words are
  handed over, the same way fetch already does.
- **Background commands left running by a previous start are visible again.**
  After a hard restart the list said nothing was running while last session's dev
  server still held its port.
- **Twenty translations had lost the value they were supposed to show** - a count
  with no number, a countdown with no seconds. They are repaired, and a build
  check now catches the next one.
- **The profiles that ship inside Skales say the same thing as the public ones
  again.** Eight model families, GigaChat among them, existed only in the
  library fetched over the network, which means exactly the machines that cannot
  reach it were the ones without them.
- **The GigaChat card offers the generation it can actually reach** and no longer
  asks for a certificate that ships with Skales.
- **The release check stopped warning about two Windows manifests** that were
  never finished and have now been removed.

### Changed

- **The user guide is a guide again.** It had a chapter system and no way to use
  it: the chapter headings in the sidebar were not links, and there was no
  search at all. The sidebar now switches chapters from anywhere, the search
  reaches every chapter at once, and each of the eleven chapters opens with a
  walkthrough you can follow on your own installation in about three minutes.
  Mobile and remote, which had no chapter, has one; so do the model readout, the
  profiles page and updates. What was in the guide and no longer true went out
  with it.
- **The waiting line, the model that writes it and its fallback stand together
  in one place.** Three settings that explain each other sat under Goals, where
  the first of them has nothing to do with goal mode, and the same feature was
  described three times on one screen. They are one section now, Assist, in
  Settings under Chat & Code, with one explanation, and the fallback sits
  underneath the switch it belongs to instead of beside it. Nothing you had set
  changes; the guide has a section on it.
- Update announcements reach every screen in the app, not just the dashboard.

## v12.7.1 - Which Model

Two reports on the day 12.7.0 shipped, both about the same thing from opposite
ends: a model you cannot reach, and a model the app names wrongly. This patch
answers both.

### Fixed

- **GigaChat reaches its current generation.** Skales talked to Sber at the
  older address, which does not serve the GigaChat 3 models at all, so an
  account with a live Ultra entitlement could not reach a single one of them.
  Skales now uses the current address, and the GigaChat card has an endpoint
  field with both hosts on it, so a company still working against the older one
  can stay there and anyone running their own deployment can type its address.
- **A model id you type is sent, not second-guessed.** Typing a model name that
  Skales had never heard of came back as "the model was most likely retired or
  renamed" even when the model was alive and well and the real problem was the
  address it was asked at. Skales now only says a model is gone when the
  provider says so; anything else names what actually happened and points at the
  setting that causes it.
- **The context readout names the model that is answering.** Picking a model for
  one conversation changed what answered but not what the readout under the
  composer said: it kept naming your default model and measuring against that
  model's window. It now names the model the next message will use, whether that
  comes from the picker, from an agent, or from your defaults.
- **The status pill says where this conversation goes.** A chat running on a
  cloud model under a local default read "Local AI", and a chat running on your
  own machine under a cloud default was labelled with the cloud provider. That
  line is a statement about privacy, so it now follows the conversation in front
  of you and goes back to your default when you leave it.
- **Switching the model with a command changes this chat, not your settings.**
  Typing the switch command wrote the model into your provider card instead, so
  it could pair a model with a provider that does not serve it, it outlived the
  chat it was typed in, and since the conversation started carrying its own
  choice it no longer reached the next message at all while still reporting
  success. It is now the same per-chat switch the picker is: your defaults are
  left alone, the provider is worked out from the model, and if more than one of
  your providers serves that model, Skales asks which one instead of guessing.
- **Context windows come from the provider's own catalogue.** A model with a
  one-million window was measured as if it held 128,000, so the automatic
  shortening of long conversations began at roughly an eighth of the real
  budget. The window now comes from the same catalogue Skales already downloads,
  and both the readout and the shortening use it.
- **The Code window names the model that will answer.** A session with its own
  model was labelled with your default one, and a session with no model of its
  own showed nothing at all rather than the default it actually runs on. Its
  context figure was measured against a model nobody had selected.
- **Lio says what "use default" means.** The option said "Settings" while Lio's
  own saved configuration is what decides, so it could name a provider Settings
  had nothing to do with. It now shows the provider and model that will build.
- **Compacting a conversation by hand uses the conversation's model.** The
  button sized the history against a model that was not running, which on a
  large window meant it cut far more than it needed to.
- **A lost connection is no longer reported as a crash.** Looking at Skales from
  your phone or a second computer and the machine running it goes to sleep,
  restarts or changes network: the request never arrives, and the screen said
  "something crashed" with the browser's own words underneath. It now says the
  connection was lost, in your language, and explains where to look. Nothing had
  crashed in that case, which is why those reports were impossible to act on.
- **The diagnostics report stops calling ordinary shutdowns crashes.** Closing
  Skales stops its engine, and each of those was listed as a recorded crash, so
  a report of four crashes could be one crash and three normal exits. They are
  listed separately now, by name.
- **A recorded engine stop finally says what happened to it.** The report
  printed the word "undefined" for exactly the entries that carry the most: the
  signal, the exit code, the last output of the engine, and the last things the
  window asked for before it went away. All of it was recorded and none of it
  was shown.
- **Times in the diagnostics report are your times.** They were written in UTC
  and formatted to look local, so an event at 19:52 was reported as 17:52. The
  report now says which timezone it is using.

### Added

- **A bug report can carry the crash your computer recorded.** Reports that say
  "it closes sometimes" are impossible to act on, while the answer sits on the
  reporter's own machine behind a Copy button on another page. The report dialog
  now offers the last recorded crash as an attachment: switched off unless you
  turn it on, and the exact text is on screen before anything is sent.
- **The wait before the first word says what it is.** Between sending and the
  first character the chat showed a spinner and the word "Thinking", which is
  the same picture a hung request draws. It now says it is reading your prompt
  and how long it has been doing so, and on a model running on your own machine
  it adds that this phase is silent by nature and can take a while on slower
  hardware. The moment the first word arrives, the line is gone.
- **GigaChat works without hunting for a certificate.** Sber's endpoints are
  signed under the Russian national root, which no operating system carries, so
  until now the first step was finding that certificate and pasting it in.
  Skales ships it and uses it for GigaChat requests only. It is never installed
  on your computer, never applied to any other provider, and it is added to the
  roots your system already trusts rather than replacing them. The field stays
  for anyone who needs their own certificate, and the card shows the exact file
  the bundled one came from.

## v12.7.0 - Everybody's AI

Skales started as a platform for everyone: set up in minutes, no prior
knowledge, grandma approved. Over the past two months Skales has grown fast -
and week by week it became more and more a power user's tool. Both are true,
and both belong to Skales. But one promise was at stake: the lightness.

So with this release we rethought setup, add-ons and settings. On first start
you choose what you want Skales to do for you - and that is exactly what you
get: a sidebar that only shows what you use, settings that in Standard show
only what belongs to your choice. And for everyone who wants everything:
Advanced still shows every screw, same as always.

Every single piece of feedback was read. We matched the roadmap against your
feedback and pulled forward what helps you today. And the promise stands: we
will keep helping people who do not know what an API is to run a safe, local
agent on their own computer - one that respects your privacy and ties you to
no cloud and no provider.

Skales stands for everybody's AI. What it is not yet, it will become.
We do not build for a target group - we build for every one of you.

### Fixed

- **A local model is allowed to think before it answers.** LM Studio, llama.cpp
  and anything else on your own machine sends nothing at all while it reads your
  prompt, and on slower hardware that quiet stretch runs for minutes. Skales
  measured it with the same thirty-second stopwatch it uses for a cloud stream,
  declared the connection dead, silently sent the whole request a second time
  (so the machine evaluated the same prompt twice), and then reported that the
  provider had stopped responding. Local and custom endpoints now get a
  generous window for the wait before the first token, and the ordinary short
  window from the first token onward, so a socket that really dies mid-answer is
  still caught. The Request Timeout slider in Settings raises that first window
  too; until now it only ever governed the wait for the connection itself, which
  is why turning it up changed nothing. Nothing about cloud streaming changed.
- **A local runtime is no longer asked to do the work twice.** A stalled stream
  used to be retried by sending the identical request again. Against a cloud
  endpoint that is a cheap second try; against your own machine it throws away
  the prompt evaluation already done and starts it over, so the retry is slower
  than the attempt it replaced. Local endpoints now report what happened instead.
- **An interrupted answer says it was interrupted.** When a provider's
  connection closes mid-generation without saying why, Skales used to record
  that as a normal finish. At the end of a chain of tool calls the result was a
  cut-off turn presented as a completed one, sometimes with nothing but a
  cheerful closing line. A dropped connection is now named as one: an answer
  that was already partly written is continued, an empty one is reported and
  retried rather than accepted, and the same is true on the Anthropic and Gemini
  paths, in the chat, and in the Telegram and WhatsApp loops.
- **A model that thinks slowly can now say so.** Skales decides how long a model
  may stay silent by reading its name, which works until a model that thinks for
  minutes is called something that mentions none of it. An LLM profile can now
  declare it outright, so the next model of that kind is a profile update rather
  than an app release. Nemotron is declared in the built-in profiles.
- **A blocked free model no longer sends you looking for a replacement.** When a
  provider answers that no endpoint matches your data policy, Skales used to say
  the model had most likely been retired or renamed. The model is there; your
  account's privacy settings exclude every endpoint that could serve it, which
  is what usually happens with free variants. The message now says that, and
  names the model.
- **A 403 from OpenRouter names its three causes.** The key being disabled or
  over its limit, the account privacy settings excluding every endpoint for that
  model, and the model's provider not accepting requests from your location, in
  the order worth checking.
- **Provider errors are read in your language.** Every provider error already
  carried a translation key and nothing ever looked one up, so all twelve
  languages saw the English sentence. They no longer do.
- **Excel and Word files can be attached.** Skales could read a .xlsx or a
  .docx off disk for a year; the paperclip just did not know the formats
  existed, so the picker never offered them and a dropped file came back with
  "cannot be read directly" and instructions to save it into the Workspace by
  hand. They attach now, in the chat, on the new-chat screen, in a coding
  session and from the phone, through the same readers the agent already used.
  A format nothing here can open (.doc, .ppt, .rtf) now says which one it is and
  what to export it as, instead of getting the same sentence as every unknown
  binary.
- **The conversation says when it stops carrying everything.** A long
  tool-heavy chat was cut to its last sixty entries at a fixed count, silently,
  while the context meter still showed room: the cut counted messages and the
  meter counted tokens, so a model started forgetting for reasons nobody could
  see. The limit now comes from the model's own window, older parts are
  summarised rather than dropped wherever that is possible, and either way a
  line appears in the transcript saying what happened. Nothing was ever deleted
  from disk, and the line says that too. Reopening a long chat shows the same
  notice in all three places it can happen; before, only one of them mentioned
  it.
- **Windows window buttons stop sitting on the Code window's header.**
  Minimize, Maximize and Close are painted over the page on Windows, and the
  Code window's header put the model chip and its buttons in exactly that
  corner. The header now reserves the width the system reports for those
  buttons, so it stays correct at any display scale. macOS and Linux are
  unchanged, and the other four windows were checked: two already reserve the
  strip, and two have no system buttons at all.
- **A working agent is no longer stopped for being slow.** Sending a second
  message while Skales was answering the first one cancelled the answer, even
  when it was three tool calls into finishing the job. Now the count only
  builds while the turn produces nothing: an agent that is visibly working
  keeps working however impatient you get, and one that has gone quiet is still
  stopped after two messages. "stop" still stops it immediately.
- **Two people on one Telegram bot are two people.** Several Telegram accounts
  writing to the same bot shared one conversation, and every message was
  labelled with the name of whoever paired the bot first. Each sender now has
  their own conversation and their own name, and /clear clears their own rather
  than everyone's. WhatsApp already worked this way.

- **The Tasks page no longer crashes on a task with no name.** A to-do created
  by a model that left the title out was written to disk without one, and every
  later visit to the Tasks page hit the crash screen instead of the list, over
  and over, until the file was deleted by hand. A task that arrives without a
  title is now named after what it says to do, both when it is written and when
  an existing one is read, so the ones already sitting on your disk stop
  breaking the page.
- **Your own endpoint is no longer capped at 65K.** A custom or LM Studio
  endpoint had no per-model table to look its context window up in, so it fell
  to a generic 65,536 - and a 200K model was compacted at a third of its window.
  Three things changed. The endpoint gets to report its own window, and Skales
  reads it whatever the server calls it. The extra endpoint slots, which had no
  advanced panel at all, now have the same timeout, retry and limit controls
  every other provider card has. And a number you type into Override Model
  Limits now wins over everything else, which it did not: a window reported by
  the endpoint quietly overruled it. The panel also says which of the three the
  figure came from, so a setting that took can be seen to have taken.
- **The context meter shows what Skales is actually using.** It resolved the
  window without ever looking at your overrides, so raising a limit in Settings
  changed how much Skales sent and never changed the number on the screen, which
  is how anyone checks. It reads the same override the call sites read now.
- **The empty composer is one line tall again.** The box grows with what you
  type by measuring itself, and the measurement counted the placeholder text as
  if it were a draft. Any moment the window was narrow - a page transition, a
  resize - "Ask anything, or describe a goal..." wrapped to six lines and a
  six-line box was burned in, and it stayed that way, because the height was
  only re-measured when the draft changed and an empty field has no draft. The
  thinking dial and the access lock also stood half again too far apart, and now
  sit as one pair. Both the start screen and the chat.
- **The German in the app says "du" everywhere.** The WordPress card, the two
  subscription disclaimers and the whole AIPointer page addressed you as "Sie"
  while the rest of the app said "du" - a tone that switches mid-app reads as
  two products stitched together. Thirty-three strings pulled across, each one
  read first, because German writes the polite address and the ordinary third
  person with the same words.
- **The German in the app is written in German again.** The strings the new
  setup and the Standard view brought with them arrived with every accent
  stripped, in all seven Latin-script languages: "Was soll Skales koennen?",
  "Rien n'est definitif", "Skales nen lam duoc nhung gi?". That was the
  onboarding, the first screen a new user reads. All of them are restored, and
  the German file is now clean throughout - two hundred more strings had been
  carrying "aendern" and "Gedaechtnis" since earlier releases. A build check
  counts the accent-free sentences per language so the next batch cannot arrive
  the same way.
- **Two settings nobody could search for.** The safety levels answered to their
  old names - strict, balanced, permissive - so typing "unrestricted" into the
  settings search found nothing, and the folders Skales must never touch
  answered to nothing at all. Both are findable.
- **Simple chat stops offering DLNA casting.** It has been retired since
  v11.3.2 and was still being advertised as always available.
- **A crash that happens in the window is now recorded like one.** Until now
  only the background processes wrote to the crash log, so a user asked to
  reproduce a crash and open Settings, Advanced, Diagnostics found nothing
  there. A render crash now lands in the same place, with its stack, and the
  crash screen says where to find it. In the chat it also carries the component
  trail that names what threw, which is the one thing that makes a crash nobody
  can reproduce fixable.

### Added

- **GigaChat is a provider now, not a workaround.** Sber's models were reachable
  only by running a proxy of your own, because the custom endpoint field wants a
  key it can send as-is and GigaChat wants something else twice over: an
  Authorization Key that has to be traded for a token roughly every half hour,
  and a root certificate that is in no default certificate store. Skales does
  the trade itself, keeps the token fresh, and trusts that certificate for
  GigaChat's requests only - not for this computer, and not for anything else it
  talks to. Paste the key, pick whether it is a personal, B2B or corporate one,
  and add the certificate on the card.

- **You can put a chat on a shorter leash.** Next to the thinking dial in the
  composer there is now an access control: read-only, read and write, accept
  edits, or auto. Read-only means Skales can look at anything and change
  nothing, and it is refused in the place tools actually run, not merely greyed
  out on screen. It is set per conversation, it survives a reload, it is there
  on the start screen as well as in a running chat, and read and write, exactly
  what Skales did before, stays the default. When a folder is bound in Code mode
  as well, the shorter of the two leashes is the one that counts.
- **Skales can show you its own crashes.** Settings, Advanced, Diagnostics:
  what this machine has recorded, on screen and on the clipboard. Crashes, the
  provider calls that failed this session, recent warnings, and the version and
  hardware they happened on. It is read from this computer and sent nowhere. An
  install with nothing recorded says exactly that, rather than implying health.
- **The assistant reads its own logs before it explains a failure.** Asked why
  something broke, it used to answer from general knowledge about programs like
  itself. It now reads the same diagnostics you can see, and says plainly when
  they show no cause.
- **LM Studio is a provider with a name.** It always worked through the generic
  custom endpoint, for anyone who knew the port, the path and that the key
  field should stay empty. It has its own card now, with the address filled in,
  no key asked for, a note about the server switch that trips most people up,
  and the local prompt-evaluation window from the first item on this list
  applied without anyone configuring it.
- **Your own browser can do the browsing.** Settings, Browser Control takes the
  full path to a Chromium-based browser, so automation runs in the profile and
  the extensions you already have. Leave it empty and nothing changes. A path
  that is not there stops the launch and says so rather than quietly opening a
  different browser, and a fork or an old build that refuses to start is named
  as the untested thing it is.
- **The add-on cards stop taking each other's entries.** Two cards on the setup
  screen could claim the same add-on, so switching one off switched something
  else off with it. Each add-on now belongs to exactly one card, and the last
  screen of the setup says how many are on rather than guessing.
- **The accessibility check measures the two setup screens too.** They were the
  newest screens in the app and the only ones the audit did not open.
- **Eight accent presets, one click each.** The three-colour picker stays for
  anyone who wants it. Every preset is checked against the same readability bar
  the picker warns you about, in light and in dark, before it can ship.
- **The note that says what this release is about is in your language.** It sits
  above the changelog in Settings, Advanced, Updates, in all twelve - because the
  person who most needs to hear that setup and settings were rethought is the one
  who does not read release notes in English. It retires itself when the build
  moves off this line, so it can never end up describing an older release.

### Changed

- **The setup asks what you want Skales to do, and builds the app around the
  answer.** A new step at the end of the first run offers five kinds of work -
  Generative AI, Audio AI, Coding AI, Business agent, Personal agent - and each
  one switches on the add-ons that belong to it. Every individual switch stays
  on the same screen, so a bundle is a starting point and not a package. What
  gets stored is the add-ons, never the category. The sidebar is then built from
  that answer: an entry whose add-on is off is simply not in the list. Chat,
  memory, planner, tasks, schedule, history and Discover are not offered,
  because they are not a choice.
- **Settings has a Standard view and an Advanced one, and Advanced still shows
  everything.** The switch sits at the top of the page. Standard shows the
  settings your add-ons actually need; Advanced shows every setting there is,
  exactly as before. It is a view and not a state - anything switched on in
  Advanced stays on in Standard, only out of sight - and search reaches both, so
  typing what you are looking for finds it either way. A tab that would open
  onto an empty page in Standard is not offered. The Advanced view is not a list
  of dangerous things: Diagnostics, Updates, Export/Import and the data controls
  live in the Advanced *tab* and are shown in both views, because those are
  things ordinary users get sent to.
- **An existing Skales is offered the new setup once, and loses nothing to it.**
  A single notice, dismissable, that opens the same add-on screen with
  everything you already had left switched on. Settings, Advanced, Setup runs it
  again whenever you want. Nothing is deleted by either: chats, keys and
  settings stay exactly as they are, and only what is shown changes.
- **Who belongs to whom is decided in one file.** Which add-ons a category
  offers, which sidebar entries follow an add-on, and which settings sections
  the Standard view shows all used to be three separate lists kept in step by
  hand. They are one map now, and a test walks the real files to prove nothing
  is missing from it - an unplaced add-on or an unkeyed settings section fails
  the build rather than quietly becoming visible-to-everyone or
  invisible-to-everyone.
- **Skales knows the interface it is actually running.** The map the assistant
  answers "where do I find X" from is no longer written by hand: it is generated
  from the same files that build the sidebar, the Settings page and the Add-Ons
  list, and the build fails if the interface moves without it. So after a
  release that rearranged a great deal, asking Skales where something is gets
  the current answer rather than a confident description of the old app. The
  answer also says which view a setting is in and which add-on it follows.
- **A new installation starts with the Desktop Buddy switched on.** Buddy is the
  face of Skales - the skin is picked during setup and it is the most used thing
  in the app - and it was off unless you went looking for the switch. It now
  arrives on, introduces itself in your language the first time it appears, and
  points at Settings, General, where it is changed or switched off. An existing
  Skales is not touched: if you never turned Buddy on, it stays off, and if you
  turned it off, it stays off.
- **Discover and Memory now stand on both sides of the sidebar.** The feed and
  the working context used to live only in the Home view, so switching to Work
  took both away. They are core surfaces and follow you across the toggle.
- **Wrapped is always on again.** The yearly recap only works if its numbers
  are collected all year, so Wrapped is no longer an add-on you can switch off -
  which also means it returns for anyone who had it disabled. Its entry stays
  in the Home view only; nothing about what it collects has changed, and it
  still leaves your machine only if you share a card yourself.

## v12.6.51 - Name The Failure

A patch about failures that did not say their name. A browser that would not
start, a sign-in that stopped with three words, a settings page that took the
whole app down with it, and a picture that came back as an error nobody could
read. None of these were new. What was missing in every case was a sentence.

### Fixed

- **The settings page no longer takes Skales down with it.** On some Windows
  installs, opening Settings ended the engine outright: the page went blank or
  the window closed, Skales quietly restarted itself, and it happened again on
  the next visit. The cause was the browser automation library, which had moved
  on to a newer version than this build can run and stops the program the moment
  it is loaded. Skales now uses one exact version, checks before loading
  anything, and refuses to load something that would end the session. The
  "Install Chromium" button can no longer pull in a version that breaks the app
  it is meant to fix.
- **A browser that cannot start says why.** Missing Chromium, no system Chrome,
  a check the machine would not let Skales run: each of these is its own
  sentence now, in your language, with the two ways out named. Browser actions
  that fail can no longer end a reply in silence.
- **Signing in with ChatGPT explains itself.** "OAuth flow failed." is gone. The
  port being taken, a firewall refusing the local listener, a browser that would
  not open, a sign-in left too long: each says what happened and what to try, in
  your language. The port is checked before your browser opens, so you are not
  sent to a sign-in page whose answer could never arrive.
- **A window that dies is written down.** If a window or the engine stops
  unexpectedly, Skales records what happened and what it was doing at the time,
  and the window comes back with the reason on screen instead of vanishing.
- **Images reach local models again.** Pictures sent to a local model through
  chat, Telegram or WhatsApp could come back as an unreadable error, depending
  on where the picture came from. All three now prepare images the same way.
- **An older channel chat shows the model it is actually using.** Telegram and
  WhatsApp chats always followed your current model choice; the label just kept
  showing the one from the day the chat started. A model you picked for a
  specific chat is still yours and is left alone.
- **The model search finds an endpoint by the name you gave it.** Typing
  "LM Studio" found nothing, because the search only knew the internal id. Your
  endpoints now appear under their names everywhere, and the internal id is gone
  from the screen.
- **Local models get their own settings again.** A newer Gemma release was
  quietly running on settings meant for a much older one, and being handed a
  shortened prompt it did not need. Measured against the real model and
  corrected. The shared profile library and the copy built into Skales can no
  longer drift apart, which matters most where the library cannot be reached at
  all.

### Added

- **A "Free" filter in the model picker.** Shows only models nobody is billed
  for: free variants and anything running on your own machine. Worked out from
  the model lists themselves, so it does not go stale.
- **Custom endpoints remember their model list.** Ask once, with a Refresh
  button and the age of the list next to it, instead of asking your endpoint
  every time you open the picker.
- **You can see how much of a request was cached.** The token tooltip now shows
  the share the provider served from its cache, when the provider reports it.
- **The model list tells the truth about what it can do right now.** When a
  smaller local model is given a reduced set of tools, it is told so, instead of
  promising an ability it was not handed.

## v12.6.5 - Say What Happened


A release about the difference between a screen that says something and a
thing that happened. Two answers people were promised, a tool family that
reported success it had not earned, and the first accessibility check this
app has ever had that actually runs.

It also clears out a set of things that were there but could not be got at: an
endpoint you had configured and could not pick, a second one you could not
find, a number under an answer that read as waste, and a grid you scrolled past
every day.

### Added

- **The system appearance setting follows the system.** Choosing "System" used
  to read your operating system once and remember the answer, so it never
  noticed a later switch and the button never stayed selected. It follows now,
  live and after a restart, and the sun and moon in the sidebar set the same
  setting the appearance row does instead of a second copy of it.
- **A busy Skales IQ says it is busy, and shows you the way on.** When the
  service cannot take a request, the message says so in your language and
  offers the next step in the same breath: connect your own provider. During
  setup the Skales IQ card stays where it is, says why it could not start, and
  leaves the other three options one click below instead of finishing setup in
  silence with no provider at all.
- **An accessibility check that runs.** Six core screens are measured against
  the WCAG AA rules and walked with the keyboard, and the check is part of the
  toolbox rather than something someone remembers to do.
- **Every extra endpoint can be made the active provider.** The additional
  OpenAI-compatible endpoints could be chosen per chat but could never become
  the one Skales routes to by default. Each one has a Set Active button now,
  like every other provider card.
- **A way to add a second endpoint from where you already are.** It used to
  live only behind a dashed tile up in the provider grid, which is above where
  you are standing when you configure the first one. The Custom endpoint card
  offers it directly and takes you to it.
- **The provider grid folds away, and remembers.** A header with a chevron
  above the tiles: fold it once and the card you actually came for is at the
  top from then on, after a reload and after a restart. The header still says
  how many providers are switched on, and a search opens the grid so a match is
  never hidden behind the fold.
- **The token count under an answer says what it is made of.** Hovering it now
  breaks the input half into the two things it consists of: the tool
  definitions and system prompt that are the same on every turn and are what
  makes the agent able to act at all, and your own message plus the
  conversation. Nothing is deducted and nothing about billing changes - the
  number was always this, it just never said so.
- **The guide says which providers work where.** Some services do not serve
  every country, which is a fact about them and not about Skales. The
  Providers chapter now lists the full replacements, including the local one
  that always works.

### Fixed

- **The sidebar and dashboard provider status is green again the way it always was:**
  an active provider with a key shows Connected immediately. The stricter
  proven-connection state briefly shipped here had no way to ever turn green for
  the provider and read as offline on every install. Live proofs are still
  recorded quietly (a successful chat turn or provider test), and while the
  status is loading the sidebar shows a neutral placeholder instead of flashing
  red with a guessed provider name.

- **Windows finds npm and Node.js again during browser-automation setup**, even
  when Node was installed last: a corrupted PATH entry hit exactly freshly
  installed Node, so everything worked in PowerShell and failed in Skales.

- **A goal that says it is finished, and a check that says otherwise, now ask
  you.** They used to argue in private: the run declared the task complete, the
  check refused to confirm it, and the run was pushed straight back into the
  same step. One run said it was done twelve times over twenty steps and only
  stopped because someone stopped it. The disagreement comes to you instead,
  with both sides on one card and three answers: accept it as done, keep
  working, or stop. A run that keeps repeating the same closing summary with
  nothing new behind it now stops on its own and says so, and it says the same
  paragraph once instead of collecting a copy of it every round.
- **A goal shows you its checklist before it starts,** and an instruction you
  wrote down in plain words ("use at least three parallel strands") stays on
  that checklist word for word instead of being summarized into something
  general and rediscovered twenty steps later.
- **WhatsApp is either connected or it is not, everywhere.** Settings said
  "Connected as ..." with your number on it while Skales itself was told
  WhatsApp needed setting up, so it would decline a message it could perfectly
  well have sent. Both now read the same answer. Telegram got the opposite
  correction: a saved bot token with no chat paired to it counted as ready even
  though nothing could be delivered.
- **A WhatsApp message says what happened to it.** All three send tools
  reported plain success whether the message went out, was merely handed over,
  or went to a number that has no WhatsApp at all. They now say delivered,
  handed over but not confirmed, or not delivered and why, and a number with no
  WhatsApp account is refused instead of quietly accepted. The three also share
  one recipient rule: a contact that works in one of them works in all of them,
  and "unknown number" and "sending to this contact is switched off" are no
  longer the same sentence.
- **One tooltip per button.** Every icon in the chat header showed two bubbles
  stacked on each other, and the expanded sidebar put a tooltip over the row
  below the one you were pointing at. There is one tooltip, and only where the
  label is hidden.
- **The keyboard shows where it is.** The chat composer looked identical
  focused and unfocused, so there was no way to tell it had the keyboard.
- **Muted text is readable.** Hints, captions and the "Configured" badge were
  below the contrast a normal text needs in every light theme, and in Neon.
  Same colour family, dark enough to read.
- **The selected temperature unit can be read** in a light theme, the Flow
  surface can be scrolled from the keyboard, and the information button on the
  Agents page has a name and opens for the keyboard too.
- **A file tool that fails says why.** Listing, moving, copying, creating a
  folder and unpacking an archive reported that something went wrong without
  saying what, and all of them told Windows and Linux users to open a macOS
  settings page. Moving into a folder that does not exist yet works, the way
  copying already did, and an archive says whether a file was left out because
  of the size limit or because it was trying to write outside its folder.
- **Typing into a web page reports where the text went,** and says so plainly
  when nothing had the keyboard and the text went nowhere. Scrolling says where
  on the page it ended up instead of always saying "scrolled down". A click
  placed by the vision model says where it clicked and whether anything
  changed. Attaching a file names the field it attached to and refuses to guess
  when the page has more than one.
- **Reading aloud stops calling silence a success.** A voice that could not be
  played counted as read, so the next voice in line was never tried.
- **A team run writes its result into the conversation it happened in,** not
  into whichever one you had open when it finished.
- **The question card in Skales Code keeps every answer.** It sent on the first
  click, so a card with three questions answered one and threw two away.
- **The Google authorization page speaks your language,** and the camera move
  you picked keeps its name after you browse another category.
- **Product names stay product names.** Seventy-two labels across the eleven
  translations had turned Discover, Swarm, Autopilot and Wrapped into ordinary
  nouns, so the thing you read about could not be found in the app.
- **The Russian first screen is Russian.** The privacy and autonomy notice
  everyone accepts before Skales starts was Russian written in Latin letters,
  as were several settings tabs.
- **The roadmap page shows the last three releases,** the guide explains why a
  long unattended run can end when a disk parks itself, and the camera-move
  count in both is the number that is actually there.
- **A model you typed in yourself is findable in the chat model picker.** The
  Custom endpoint has no catalogue to offer - the model is whatever you point
  it at - and that turned out to mean its model appeared in no list the picker
  reads. So an endpoint that was set up, switched on and working could not be
  chosen for a chat unless it happened to be the active provider already. Any
  model you configure on any provider card is searchable now.
- **The extra endpoints speak your language.** That whole block was English
  only, in all twelve languages.
- **A local Qwen 3.6 acts instead of printing what it meant to do.** The model
  writes its tool calls in a shape Skales did not read, so a request to look at
  a folder came back as a line of raw text where the answer should have been.
  Skales reads that shape now, and Qwen 3.6 has settings of its own instead of
  borrowing an older model's.
- **The Open Flow button in Studio can be read.** White on the accent colour was
  below the contrast text needs, on that button and on six more like it. They
  take the readable colour for whichever accent you are running.

## v12.6.2 - Nothing Green Without Proof

Two people wrote in the same night to say Skales had told them a file was saved
and the file was nowhere. A third could not connect her iCloud calendar because
that connection had never been able to work. This release is about the gap
between what the screen says and what actually happened.

### Added

- **A connection is green only after it was tested.** Every "Connected" and
  "Active" badge in Settings now means a live test reached the service and
  passed, and hovering it says when. Credentials you saved but never tested read
  "Configured" instead: the card still looks set up, it just stops promising a
  connection nobody has made. Saving or changing a credential drops the old
  result, so a passed test can never vouch for a new key.
- **Test buttons where there were none.** Notion, Todoist, Spotify, Home
  Assistant, Replicate, Stability, ElevenLabs and Runway can be tested from
  their own card, and Slack, Signal, X and your Google account got a button for
  the check that already existed behind them and was never run. Kling, Fal and
  Atlas Cloud have no such check, so they stay honest at "Configured".
- **Apple Calendar works.** iCloud refuses every request against its front door,
  so Skales now walks the discovery path Apple expects, finds your calendars and
  writes to a real one. You can pick which calendar new events go into, and a
  refused connection says whether it was the password or the address.

### Fixed

- **A saved file says where it is.** Generated images, videos, voice files and
  merged clips now report the full path they were written to instead of a bare
  filename or a folder nobody could locate, the answer card shows that path with
  a button that opens it in your file manager, and Skales is no longer allowed
  to tell you a file was written unless the tool that wrote it says so.
- **Answers no longer carry internal markers.** A model that quoted a tool
  result word for word used to quote the fences around it too, and they landed
  in the answer. The markers come off, the quoted text stays.
- **The token line under an answer reads correctly.** It showed one number that
  looked like the cost of the reply while it was mostly the question, the
  instructions and the tool list. It now shows the two directions separately.
- **The VirusTotal key check asked an address that does not exist,** so a valid
  key was reported as invalid. It also tested the dots the field shows instead
  of the key you saved, so the answer was "invalid" every time after a save.
- **LinkedIn posts and uploads use the current API,** and fall back to the older
  one only when LinkedIn says this app may not use the new one.
- **Microsoft mail says what it can and cannot do.** Work and school accounts
  cannot be connected with a password at all; personal accounts usually can with
  an app password. A refused send now explains itself the same way a refused
  inbox already did.
- **A file written while the disk is waking up is written, not lost.** Scheduled
  jobs running unattended could fail on a write that a moment later would have
  worked.
- **Skales Code on the phone shows your coding sessions again,** even when you
  have thirty newer chats, and archived sessions stop appearing as live work.
- **Switching a team off during its final step no longer writes a verdict over
  the run you cancelled.**
- **Signing out of the Google account clears the form it was set up in.**

### Changed

- The model picker mentions the four thinking levels once, so the strongest one
  is not something you have to find by accident.
- Release builds fetch the Linux package before writing the update manifest, and
  refuse to write a manifest that silently leaves it out.

## v12.6.1 - Order and Follow-Through

The release after the big one is where your first week of feedback lives. The
provider page you can finally read, agents that take turns on one graphics
card, a scheduler that owes you nothing after a night of sleep, and a dozen
small wrongs made right.

### Added

- **The provider page is a grid you can read.** Every provider is a tile with a
  short description, badges for what it can do (voice, vision, media) and a
  switch. Switched off means gone, from the page and from every model picker.
  Filters find providers by capability, and "+ Custom endpoint" is a tile like
  the others. Choosing your active provider works exactly as before, and no
  setting was removed: the advanced ones now live in the provider's own card or
  in one folded Advanced Routing section at the end.
- **Tencent Hunyuan is a provider**, with a switch between its regions.
- **Agent teams can take turns.** On local models, running several agents at
  once means they fight for the same graphics card. Sequential mode runs them
  one after another and unloads each model where the runtime supports it, and a
  new "Keep models loaded" setting for Ollama puts that duration under your
  control, from unload-immediately to always.
- **MCP servers that use a plain API token** get a headers field right in the
  form, and a rejected request no longer pretends the server wants a sign-in.
- **skales:// links.** A link can open Skales and land on the right screen.
  Nothing is downloaded or executed without a confirmation card first.
- **Bring your own vector database.** Qdrant and ChromaDB work as retrieval
  backends beside the built-in store, and the built-in one remains the
  fallback.
- **One Telegram bot, several chats.** Pair additional chats and choose where
  an answer goes.
- **The scheduler survives sleep.** Runs missed while the machine slept are
  caught up on wake, and a timer that the system froze says so instead of
  silently drifting.
- **A headless start** for machines without a screen, reachable through the
  existing web access, and **a tiny-model preset** that trims tools and context
  so sub-1B models stay usable.
- **The guide explains the three multi-agent modes** and when to reach for
  which.

### Fixed

- Buttons and links that were invisible on dark themes. A whole family of dead
  color references, all of them found and replaced, with a check that keeps the
  class out.
- Signing in with your Google account now unlocks Drive and Docs everywhere,
  not only Calendar, and each card says which login it is actually using.
- The voice list loads for every provider, not only one, and the preview button
  plays a sample on each.
- Conversations keep a timestamp per message instead of a clock in the prompt,
  which keeps long conversations faster and cheaper.
- The navigation menu no longer hides behind page content.
- Local models that write their tool calls as plain text in one more dialect
  are understood and executed instead of leaking markup into the answer.
- An agent that stops after a failed tool now says which tool failed instead of
  returning nothing.
- In team runs, your agents' own instructions outrank the coordinator's
  boilerplate.
- A crash remembers where it happened: the next bug report
  you send automatically carries the screen and the component that crashed,
  so you do not have to.

## v12.6.0 - Iris Orbit

The release about things that were happening where you could not see them, and
about who decides once you can. A decision waiting below the fold, a message
that never arrived, a browser session frozen behind a dialog nobody mentioned.
Then: a team of agents that ranks its own answers and hands the choice back to
you, a plan you read before it is written, and a camera move you pick before the
shot is filmed. Skales recommends. You decide.

### Added

- **Iris Orbit is switched on when you install Skales.** The release is named
  after her, and a surface you have to find in Settings before it exists is a
  surface nobody finds. Nothing else changed: if you turned her off, she stays
  off. Without a provider key the window says so and offers the way to Settings,
  Voice, the way every other surface that needs a key does.
- **"What can I say?" is a list you can read.** Every sentence Iris understands
  was already there and written down nowhere: turning her into a shape, asking
  for something as a document, a web search, a timer, your tasks. The window's
  menu shows all of it with a real example each, in twelve languages, and asking
  her out loud what she can do gets the same answer without a tool call.

- **Iris Orbit: a way to talk to Skales instead of typing to it.** A window of
  its own, black, with no toolbar and no message list: a particle eye in the
  middle and one quiet line of text under it. Hold the space bar and speak. Iris
  hears when you stop talking and answers on its own, out loud, and the line
  under the eye shows what is being said, sentence by sentence, like a subtitle
  rather than a chat log. The eye reacts while it happens: it warms and pulses
  with your voice while it listens, looks away while it works, and becomes a
  circular soundwave while it speaks. It follows your cursor when it is idle,
  and clicking sends a ripple through it.
  Iris is a face on Skales, not a second assistant. The same conversation, the
  same model, the same tools, the same memory: ask it to forget something and it
  is forgotten everywhere. Iris opens where you left off and says so, "new
  conversation" starts a fresh one, and any chat you are already in can be
  carried over by voice from the button in its header, with everything that was
  said so far coming with it. Go back to the chat afterwards and the spoken
  turns are simply the newest messages in it.
  If speaking is not on right now, start typing: a single line appears over the
  eye, Enter sends it, Escape puts it away again. "New conversation", "my
  tasks", "timer ten minutes" and "forget X" are answered directly, with no
  model involved at all. Cmd or Ctrl plus K brings up the earlier conversations;
  Escape stops whatever is running, and closes the window when nothing is.
  The first time you open it, Iris introduces itself. That plays once.
  The window takes your own light or dark theme, like the Code and Flow windows
  do: a glow on black at night, dark points on a light ground by day.

- **The eye answers with more than words.** Every command Iris can answer
  directly now has its own visual reply. Set a timer and the particles become
  the remaining time, spelled out as digits that count down. Ask how far along a
  goal is and they draw the progress as a bow. Ask her to forget something and
  they scatter and gather again. Start a new conversation and the eye blinks. A
  reminder going off sends a ripple out from the middle.
  You can also just ask for a shape: "morph into a car", "become a feather", in
  any of the twelve languages. There are about fifteen hundred of them, and they
  turn up on their own as well: write down "call the dentist" and the eye
  becomes a telephone, and while Iris is talking the particles quietly take the
  shape of whatever is being discussed. That last one can be switched off under
  Settings, Voice, if you would rather the eye stayed an eye.

- **Results appear inside the eye instead of opening windows.** A picture, a
  document, search results, a short list: the ring leaves the eye, becomes the
  border of a panel, and the result appears inside it. One at a time, and Escape
  puts it away and brings the eye back. Heavier things are handed to the window
  that already does them - a page goes to the browser, a render goes to Studio,
  code goes to the Code window - and Iris tells you where she put it.
  Cmd or Ctrl plus slash opens Help, which lists every command, what it does,
  which answer the particles give, and a sentence you could actually say.

- **Iris does the work, not just the talking.** "Twenty-five minutes of focus"
  starts a timer you can pause and resume by voice or by clicking; when it runs
  out, Iris says so. "What is on today" reads your tasks aloud and shows the
  list, and you can tick them off from there. "Show me the status" reads out how
  far along a goal is. All of it goes into the lists, the schedule and the goals
  you already have - there is no second copy anywhere. Anything that finishes
  while the window is open is spoken as it lands; anything that finishes while it
  is shut is waiting to be read out the next time you open it.

- **Settings, Voice: one place for all of it.** The voice that speaks, the ear
  that listens and Call Mode used to be three cards under Integrations, next to
  Notion and Spotify. They have moved to a tab of their own, together with the
  things that never had a home: how long a silence ends your turn, which key is
  push-to-talk, and what happens when you talk over an answer. There are named
  presets for a local Kokoro and a local Whisper that fill in the endpoints for
  you, so running your own voice on your own machine is something you can find.

- **A wake word you teach yourself.** Say "Iris" three times in Settings, Voice,
  and she learns your pronunciation - yours, not a model's idea of it, so it
  works whatever your accent. Then you can just say her name instead of holding
  the space bar. Everything happens on your machine: the recordings become
  numbers there and are dropped, and nothing is uploaded. When the ear is open
  the window says so; there is never a microphone listening in silence.

- **Talking over her stops her.** With any provider at all, the microphone stays
  open while Iris speaks, and starting to talk cuts her off - what you said
  becomes the next thing she answers, the way it works with a person. Where a
  provider offers a live audio channel of its own, that can be picked instead;
  where it does not, the option says so plainly rather than quietly doing
  something else.

- **A word while a slow model is still thinking.** Some models take several
  seconds before the first word arrives, and a screen with nothing on it but a
  pulsing dot reads as broken rather than as busy. If nothing has arrived after
  a second and a half, the small assist model you set under Settings, Goals,
  Light-pass model writes one short line about what you just asked, in your
  language, into the same place the thinking indicator sits. It disappears the
  moment the real answer starts, it is never part of the conversation, and it is
  never sent to a model again. With no assist model set, and on a model that
  answers quickly, nothing extra happens at all.

- **A team of agents has someone in charge of it, and you have the last word.**
  The first seat of your roster is the coordinator now. Before anyone answers it
  reads the assignment and breaks it down: what a complete answer has to cover,
  and which angle each agent leads on. Every agent then answers the whole thing
  with that brief attached, on its own model. Afterwards the coordinator compares
  what came back and writes a verdict: a ranking, two sentences per agent saying
  why it sits where it sits. No scores, no marks out of ten. The verdict
  recommends and decides nothing, and it says so.
  Every agent card carries two buttons. "Continue with this agent" switches the
  session to that one agent and hands its answer to the next turn as the thing to
  build on. "Take this result" puts the answer into the conversation, or saves it
  as a file where there is no conversation to put it in. Both survive a reload.
  The same cards and the same two buttons now appear everywhere several agents
  produce results: chat, Skales Code, Tasks, Group Chat and the Organization
  result list draw one component instead of five versions of a list.
  Every way a run can end is its own state rather than an error message in
  English. One agent failing leaves a ranking of the rest; all of them failing
  leaves an honest line instead of an empty verdict card; counting the Agents
  button back to one ends the run instead of leaving it working behind a door you
  just closed; and a run whose process died is recognised when you reopen Skales
  and closed off, keeping whatever had already arrived.

- **Flow can film a shot, and you pick the camera move first.** A new chip in
  Flow: Film. It makes one clip with one deliberate camera move, chosen from a
  grid of fifty-one moves grouped by what they are: zoom, dolly, crane, pan,
  orbit, rig, aerial, lens. One move per clip and no way to pick two, because
  mixing them is what makes generated footage look generated.
  The moves are Skales' own film language, not a pointer at somebody else's
  preset library: each one carries its own formula in three parts, where the
  camera sits, what it does and how the move runs over time, and that formula
  shapes the prompt for whichever backend makes the clip. So the order starts
  with your own keys: the video APIs under Settings, Skales Studio first, then a
  Hugging Face Space you have activated, then a connected media server such as
  Higgsfield if you happen to have one, as the optional connector it is.
  With none of the three set up the chip does not disappear and does not pretend:
  it says which key is missing and where it goes, and it keeps the move you
  picked. Follow-up takes build on the last one instead of starting over.

- **Seedance and Atlas Cloud in Settings, Skales Studio.** Seedance was in the
  list and could never have worked: both of its model rows named an address that
  does not exist, so every attempt came back as not found. It runs on fal now,
  which is ByteDance's own route and the only one carrying Seedance 2.0, and the
  rows for people whose key is at Replicate are repaired rather than dropped.
  Atlas Cloud is new: one key across several hundred models for chat, image and
  video, billed per use, and it shows up as a provider in the same three places
  every other one does.

- **Skales asks you one question, once.** If you were already using Skales
  before this version, a box appears once and asks what is missing, what could be
  better, what you actually use it for, what you love and what you do not. One
  text field, any language, as long or as short as you like. It goes straight to
  Mario and it is not published anywhere. A checkbox under the field links to
  the privacy policy, and nothing is sent before it is ticked. "No thanks"
  closes it for good, and a fresh installation is never asked.

- **Hugging Face Spaces count as a media backend in Flow.** The integration has
  existed for a long time and Flow was built straight past it: a Space you had
  activated sat in the model's tool list and was never offered here. Image, video
  and film all know about them now, as the free-or-nearly-free route with a
  shared queue.

- **More than one agent can answer, and you can see each of them.** The composer
  gets a button next to Auto with a number in front of it: how many agents your
  next message goes to. One is off and means what it always meant - the default
  agent, or whichever one you picked for this chat. Every click counts up to six
  and back to one. A run of more than one shows up as cards, the same cards tool
  calls and diffs already use: one for the run, one per agent that opens to that
  agent's answer, and a summary at the end. Who takes part is arranged on the
  Agents page, in a section above the cards; the order in that list is the order
  they run in, so "3 Agents" means the first three. The first seat belongs to the
  default agent and does not move, because somebody has to write the summary.
  Tasks can be run the same way from the create dialog.

- **One Google account instead of the same account asked for five times.**
  Calendar, Drive, Docs and YouTube each wanted their own credential for what is
  one Google account. Sign in once under Settings, Integrations and it covers all
  four. Every one of those fields still wins whenever it holds something, so
  nothing you already set up changes; with no account connected nothing changes
  at all.

- **An archived coding session can be looked at again.** Skales Code could put a
  session away and nothing anywhere could bring it back. The session list has an
  archive icon at the right of its heading now: one click shows what was
  archived, with Restore in the right-click menu, another click returns. The
  search box works in both.

- **Skales can give a web page a file.** Attaching a picture to a post used to
  end in the operating system's file dialog, which Skales cannot use and which
  freezes the browser until you close it by hand: an agent would try eleven
  other ways and post without the picture. The file now goes to the page
  directly, no dialog involved, and a click that would have opened one is
  refused with the way that works instead.

- **A browser session that is stuck says so and stops.** It used to keep trying
  until the budget ran out, because from the inside a blocked page and a slow
  page look the same. Now it recognises being held, ends, and tells you why.

- **You can see which sites Skales is signed in to, and sign out.** Skales
  browses in one profile, so a login stayed until you deleted a hidden folder -
  and there was no list of what was in there. Settings shows the sites, signs
  out of one, or clears the profile completely. It refuses while a browsing
  session is running, because the browser writes the profile back when it
  closes and the deletion would quietly be undone.

- **Replace every occurrence in a file in one go.** Changing the same thing in
  seventy places meant seventy edits, and it was easy to lose the thread halfway
  through. One call now does the file, by exact text or by pattern, and says how
  many places changed.

- **A permission you can answer once for the whole session.** Flow could ask the
  same question ten times in a row with only two buttons on the card. There is
  now a third: allow this kind of action for this session. It covers the action
  AND the reason it was stopped, so agreeing to a command inside your project
  folder is not agreeing to one that reaches outside it. It lasts for the
  session, is never saved, and lifts no safety guard. Under Auto, confirming
  once is enough - which is what choosing Auto was supposed to mean.

- **Your phone can watch a team work.** Starting a team task from the phone used
  to show nothing at all until it finished. The Organization view now sees who
  is working, who is waiting and what tool is running, the same live picture the
  desktop has.

- **Your own transcription server has its own settings.** It shared a card with
  text-to-speech and only appeared when you set the SPEAKING provider to Custom,
  so running your own transcription meant changing an unrelated setting first.
  It sits in the Speech-to-Text section now. Both directions also take extra
  parameters for your server - temperature, language, guidance, steps, whatever
  yours has - as one field rather than a fixed list that would go stale.

### Changed

- **The local voice engines are marked as what they are: optional, and not
  Docker.** The card offering Kokoro and Whisper showed a `docker run` line and
  nothing else, which read as though Skales wanted Docker. It says plainly that
  Skales itself never needs it, carries a Docker-free command for each engine
  beside the Docker one, and is labelled Optional. Ask Skales to install either
  one and it now walks the whole route for your system, health check and
  uninstall included, through the normal command approval.

- **Iris Orbit says it is a first version.** A quiet "Beta v1.0" in the corner of
  the window and a line in its settings block, plus the licence the engine is
  under and where to read it.

- **The sidebar's Iris entry is an eye.** The dot ring stays where it means
  something: the window, the settings block and the logo.

- **The user guide covers the shared Google account and Iris Orbit.** Neither
  was in it. The Google chapter walks the Cloud Console setup end to end, says
  which client type to pick, and explains why a service's own key still wins and
  why adding a service later asks for consent again. The Iris chapter covers
  opening it, speaking, typing, morphs, timers, the wake word, the right-click
  menu, languages, and where the conversations live.


- **A plan is something you read before it exists.** "Generate Master Plan" used
  to create every task in it in the same breath, so the first time you saw a plan
  it had already been written into your board. It is a draft now: a list you
  read, untick and edit, and only "Create these" writes anything. A task the
  model got wrong no longer takes the whole plan down with it either. The usable
  ones survive, and the ones that were left out are named with the reason.

- **A Quick Task is a task, not a title.** One line still starts it, but what
  gets created carries instructions the agent can act on, the project it belongs
  to and the agent best suited to it, each one a suggestion you untick if it is
  wrong. And the warning that the task will not run while Autopilot is paused is
  the switch itself now, where the warning is, instead of a sentence about a
  button elsewhere.

- **Cards on the Autopilot board move by dragging.** Two moves are refused rather
  than faked: you cannot drop a card into "in progress", because that is where
  Skales puts a task when it actually picks it up, and you cannot drag one that
  is running out from under the runner. A move also clears what the new column
  would otherwise make untrue.

- **The running-goals strip stops being a shelf.** Open the goal where it lives,
  carry it on, or stop it, without leaving the page.

- **The composer bar never breaks into a second line.** In a narrow window it
  scrolls sideways instead, the way Code and Flow already do, with the context
  readout on the left pinned where it can always be read.

- **Skales is counted while it is running, not while Discover is open.** The
  online figure came from the Discover tab and only from people with a gamertag,
  which meant it was measuring almost nobody. It now reflects running apps.

- **What belongs to the conversation stands in the conversation.** The live view
  of the browser, the plan the model proposes and the offer to turn a chat into a
  goal used to hang above the text box in their own sizes, outside the
  conversation. They sit under the last message now, the width of a message, and
  scroll away with everything else that happened.

- **The user guide is user help.** Five chapters of release notes had grown into
  it, the newest at the very top, so the first thing a new reader met was a list
  of things they did not know they were missing. They are gone; what changed in
  a release is in the changelog, which is where you are.

- **Skales IQ: internal routing update.** Nothing to set, nothing to notice.

### Fixed

- **What Iris writes appears in the ring, not as a clipped line under the eye.**
  Ask her for a poem, a list or a summary and the text lands inside the frame,
  readable, with one short spoken sentence beside it. Until now the ring only
  ever opened for a tool result, so an answer that WAS the thing you asked to see
  was cut off mid-word in the subtitle line.
- **The Iris window no longer stands still for several seconds when it opens.**
  Opening it made four requests to the local server one after another, with
  nothing on screen moving while they queued. Three of them never depended on
  each other, and the app now warms the window's own route at launch as well.
- **Approving a file no longer throws you into the Code window.** Saying yes to
  "may I write this" is not asking to change windows. Iris says where the file
  went and stays where she is.
- **Iris asks for permission in her own voice.** The question used to arrive as
  a chat approval card over the eye. She now says what she wants to do, the two
  answers are hers, and "yes" or "no" out loud answers it in twelve languages.
- **Iris does not play the thing she turns into.** Asked to become a car she
  wrote a short story about being one, signed off as it, and quietly dropped the
  document that had been asked for in the same sentence. A morph is what the
  particles do; she stays herself, and the task in the sentence still gets done.
- **Iris says who she is in one sentence.** "I am Iris, the voice of Skales",
  written out per language rather than improvised, after a weaker model answered
  "I am Iris, Skales at the wheel".
- **She opens with something different each time.** Fifteen greetings per
  language, rotating, instead of the same sentence at every open.
- **Iris speaks like a person about her microphone.** "Ear open", "ear shut,
  voice off" was a literal translation of an English image into all twelve
  languages. It says listening, mute and unmute now, and the German, French,
  Croatian, Turkish, Portuguese and Vietnamese lines got their accents back.
- **Iris answers no longer ring a bell in the main window.** Every spoken answer
  produced a "message finished" toast and a chime in the window you were not
  looking at, and the Code window did the same. A companion window that is open
  is you being on that surface.
- **"Continue with this agent" folds the cards and gives you the composer.** It
  answered the question those cards were asking and left all six answers
  standing between you and the reply you now wanted to type. A conversation
  opened again loads its finished run folded, and the cards have a ceiling and
  their own scroll instead of growing over the input bar.
- **The working basis is a chip, not a wall of text.** Carrying on from an
  agent's answer put that whole answer into the conversation as raw text, and in
  the Code window it was glued onto the front of the next thing you typed, so
  your own "ok stop" came back with an essay in front of it. It is one line you
  can open, and it travels beside your message rather than inside it.

- **Iris keeps listening.** With the ear open, the microphone still closed after
  every answer and Space had to be pressed again to say the next thing. The ear
  now reopens by itself at the end of everything she says, until "Ear shut,
  voice off" or the window closes. That entry brings her back too.
- **A document Iris writes appears in the ring.** After the fix that stopped her
  framing the bookkeeping around a document, she framed nothing at all: the tool
  message is a receipt, and the document itself goes into this conversation's
  document panel. She now reads the receipt as what it is, a title, and puts the
  real text in the frame under its own name. The guide has a new section on what
  opens a ring at all: a picture, a document, a web search, a list.
- **A failed transcription says which provider refused, and why.** "No
  speech-to-text provider available" with a working key configured: every leg
  had been tried, each had thrown, and the reasons were only in the server
  console. The message now carries them ("OpenRouter: 402 ...; Groq: no key"),
  and a genuinely unconfigured setup still says that instead.
- **Iris no longer introduces herself as Skales.** On a long conversation a
  weaker model would read the voice profile, then four thousand tokens of other
  things, and open with an apology for the wrong name. The one identity line is
  repeated once at the very end of the prompt. Same profile, no second persona.
- **The relay stops fighting itself in the log.** `socket REPLACED` once a
  second, filling the console and burying every other line. The reconnect used
  to reset its backoff every time the relay let it in, so two connections
  claiming one identity evicted each other forever at exactly one second apart.
  Being replaced now backs off and the line is printed once a minute with a
  count, and it names the process it came from, which is the fact that answers
  it. The engine that opens those connections is also single now: nothing
  stopped a second one being started over a running one.
- **A stream that ends twice no longer throws.** `Controller is already closed`
  in the console, from closing a stream whose reader had already gone, in fifteen
  places across the update, build, plan and pull routes.
- **Six debug lines per model response are gone from the console.** They printed
  the raw provider answer, including its content, on every step of every turn.
  One line is left, and only when a step really came back empty, saying what
  that means. A model that spends its whole reply budget on reasoning already
  ends in a proper answer that says so.
- **Iris' voice is a list you can read.** It was a text field asking for a
  provider voice id in the provider's own spelling, which nobody knows by heart.
  It is now a dropdown of the voices your TTS provider actually has, fetched
  from the provider rather than baked in, so a voice you cloned five minutes ago
  is in it. "Provider default" leads. Where a provider has no list to fetch, it
  says so and the field stays, so an id you do know still works.

- **A run with several agents survives a reload.** Asking a team of agents a
  question in a fresh conversation started the run against a conversation that
  did not exist yet: the question, every answer and the verdict were written
  nowhere, and reloading left only whatever was typed afterwards. The question
  now goes into the conversation before the run starts, the verdict is written
  into it by the server the moment it is ready, and reopening a conversation
  finds its run again and repairs a verdict that never made it in. Nothing in
  that path fails quietly any more: when something cannot be saved, the
  conversation says so at the time instead of losing it silently.

- **A finished team run can be folded away.** After the verdict has been read
  and an agent picked, the cards collapse to one line saying how many agents
  answered and whether there is a verdict, and open again on a click. The state
  belongs to the run, so a phone and the desktop agree about it. The whole run,
  every answer and the verdict, is also kept as one Markdown file next to your
  other documents, so folding the cards away never loses it.

- **The team cards no longer follow you into the next conversation.** Switching
  conversations, or starting a new one, left the previous run's cards sitting
  above the composer.

- **"Take this result" in the Code window puts the result in the session.** It
  used to trigger a browser download, which on a phone reaching the window
  remotely meant the answer ended in a downloads folder instead of the work.
  Pressing it twice also used to add the same answer twice; it does not now.

- **A team run started from the Code window's start screen is visible.** Sending
  with two or more agents before a folder was open started a real run that was
  drawn nowhere at all. The folder is asked for first, as it is for an ordinary
  message, and the run happens in the session that opens. The run is found again
  after a reload, and the agent picked to carry on is still picked.

- **Speech that could not be transcribed by your own server says so.** Pointing
  Skales at your own speech endpoint and having it go down moved your voice to
  whichever cloud provider had a key, without a word. It still keeps working,
  and it now tells you it happened. Transcription through Hugging Face also
  returned something that was not text at all, so Iris said "[object Object]"
  out loud and dictation in the chat failed with an empty error message.

- **The feedback form looks like a form again.** Its backdrop had a three pixel
  blur and no Safari equivalent, so through a browser it was a flat dark sheet
  over an app you could no longer see. It uses the same glass as every other
  Skales overlay now, in every browser. The same missing Safari line was fixed
  in twenty-odd other overlays across the app.

- **Settings stops telling you to update an app that is already current.**
  "Desktop Control" probed a bridge that only exists in the desktop window, so
  viewing Skales in a browser always read "Update to the latest build to enable
  replay". It now says which of the two situations you are actually in.

- **A voice setting that could not be saved says so.** The switch moved on
  screen and quietly went back on the next visit.

- **Iris works when you reach her through a browser.** Three things in her
  window asked the desktop app for something that only exists in the desktop
  app, and did nothing at all otherwise: "Voice settings" in her right-click
  menu, Escape on the resting eye, and handing a result to Studio, the browser
  or Skales Code - which she announced out loud while nothing happened. Each of
  them now opens the place it names, in whichever shell she is running in.

- **Iris can hear you.** On macOS the microphone was dead: the signed app was
  never given the right to use one, so the system never asked and Skales did not
  even appear under Privacy and Security, Microphone. It asks now, and if the
  answer is no it says so and opens the right settings pane instead of listening
  at nothing. When speech cannot be turned into text, the reason is said out
  loud and written under the eye rather than swallowed: "I could not understand
  you" with what actually went wrong, in place of silence.

- **After the greeting, Iris listens by itself.** No key needed: the ear opens
  when the last word of the welcome has been spoken, the line under the eye says
  so, and it closes again when you stop talking, like any other turn. The space
  bar is still there for when you want it, and holding it down no longer cancels
  the very turn it started.

- **Right-clicking in the Iris window does something.** New conversation, your
  earlier conversations, the voice settings, copy the last answer, ear shut and
  voice off, close the window. There is also a small cross at the top that
  appears while the mouse is moving and fades away when it rests, so the window
  can be closed without knowing that Cmd or Ctrl plus W works. The buttonless
  surface stays buttonless.

- **Iris speaks your language.** The welcome was always English, whatever the
  app was set to, because the greeting was written before the language had
  finished loading. It now follows the app's language like everything else, and
  Iris answers in it too. There is no separate language setting for the voice:
  one language, set in one place.

- **The name question takes Enter.** Answering the "what should I call you"
  prompt with the Return key did nothing at all, and only Skip worked. Typing
  and pressing Enter now answers it, and an empty Enter means "no name, carry
  on".

- **Typing to Iris is findable.** The text field appears when you type and is
  invisible until then, so it was easy to miss entirely. A single quiet line
  says so once, and never again after you have used it.

- **Wake-word training says what happened.** It could fail six different ways
  and reported five of them as "no microphone", including the case where the
  speech detector simply had not loaded. Each one now names itself. There is a
  Stop button that stops it, a Start over button, a live level bar so you can
  see the microphone react while you speak, and a microphone picker for machines
  with more than one input - which the whole voice loop then uses, not just the
  training.

- **A team of agents answers a typed question too.** Setting the Agents button
  above one and then typing ran the message as a single ordinary turn: only
  messages with a picture attached ever reached the team. It also says up front
  when your roster is smaller than the number you asked for, instead of quietly
  running fewer, and an answer that came out of a team says how many agents made
  it rather than naming one model. Chats that ran a team are marked in History.

- **Spoken conversations are marked.** They were always ordinary conversations
  in the ordinary list - which is the point - but nothing said which ones had
  been spoken. History marks them, and reopening one in the chat shows which
  turns were said out loud.

- **The border around a result has no gap, and fits the answer.** The frame the
  particles form was missing its top right edge, and it was built at a fixed
  size before the panel existed, so a two-line answer got a full-page border. It
  is now measured from what is actually there, and the line of text moves with
  it. In a narrow window the eye no longer runs off both sides.

- **The one question about how Skales is going comes back.** Telling Iris your
  name rewrote the identity file, and the "is this install old enough to ask?"
  check read that file's date - so answering Iris reset the clock and the
  question went quiet for another three days. The clock is now set once and
  nothing can move it.

- **Running out of Skales IQ credit is a state, not an error.** A turn that hit
  an empty balance ended in a red error with a provider message in it, and a
  goal or a scheduled task that hit it was marked failed, its work thrown away.
  It now says what happened in your language and offers the way on: put your own
  key in, and carry on. A goal is paused rather than failed, keeps every step it
  had already done, and continues from there instead of starting over. Nothing
  is retried against an empty balance any more, so a background task no longer
  spends attempt after attempt on a request that cannot succeed. A user on their
  own key never meets any of this.

- **Stopping a team of agents stops the one that is already answering.** Counting
  the Agents button back to one ended the run, but an agent already talking to
  its provider carried on generating an answer nobody would read, on a metered
  connection, until it was finished. It now stops mid-sentence. Its card says it
  was stopped rather than claiming it failed, and an answer that had already
  arrived stays where it is.

- **A long message from us is readable on the phone.** Broadcast texts stopped at
  about sixty characters on a phone while the computer showed all of them, and a
  message with no link behind it had nothing to open. The full text is shown, and
  a long one opens out with a tap.

- **A team of agents on the phone no longer gives up over a stray bracket.** If
  the agent writing the plan added a friendly closing line, the plan was read as
  unreadable and the whole run ended, over a plan that was perfectly good.

- **Dragging a link no longer shows you a web address.** Nudging any menu entry
  painted the browser's own drag preview, with the page title and a localhost
  address under it. A desktop app should not show its web insides, and nobody who
  brushes a menu item while scrolling asked to see the address of anything.

- **An agent you edited by hand is not overwritten by a page that was open.**
  Agent definitions are files, and a prompt shortened in the file could come back
  longer the next time the Agents page saved. Every write stamps the file now,
  the bookkeeping the app does after a run merges into the file as it is at that
  moment rather than a copy read minutes earlier, and a save that would clobber a
  newer file is refused and says so instead.

- **The Studio upload to YouTube works.** It read a setting nothing in the app
  ever wrote, so it could not publish at all, whatever you had connected. It now
  asks the same place the rest of the app does.

- **The YouTube tools are offered to anyone who has YouTube.** They only appeared
  for people with a separate API key, and stayed hidden from anyone whose Google
  account already covered it.

- **A saved key shown back as dots can no longer be saved as dots.** Reloading
  Settings filled the Drive, Docs and YouTube fields with a masked stub, and
  pressing Save wrote the stub over the real credential.

- **A decision waiting out of sight is visible.** In Skales Code the transcript
  could grow past a permission card sitting below the fold, with the session
  paused on it and nothing to say so. There is a jump-to-latest arrow now, and
  when something down there needs an answer it becomes a marked badge with a
  count.

- **Skales Code names its sessions.** Every one of them was called "New Chat",
  forever, which made the history a wall you could not find anything in. A
  session is named after the work after its first exchange.

- **Commands find the tools your terminal finds.** `npm` could be "command not
  found" in a Skales Code session while it worked perfectly in your own
  terminal, because an app started from the Dock does not inherit your PATH.
  It does now.

- **A message you queued gets delivered.** Typed while a long task was running,
  it could be dropped when the task finished instead of being sent as the next
  turn.

- **Flow shows a finished page in its own preview.** It would ask for approval
  and then open the page in your system browser, while the preview panel beside
  the chat was already showing that exact file.

- **An agent reads the assignment you actually gave it.** A background task's
  instructions were welded together with the harness's own rules into one block,
  so the agent was free to summarise the lot and work from its summary - which
  is how an assignment came back broader than it was written, with examples
  nobody had supplied. Your words now arrive exactly as written and marked as
  yours.

- **Publishing a subfolder no longer overwrites the homepage.** Publishing sends
  the CONTENTS of a folder, so forgetting to name a destination put a subpage on
  the site root. It happened twice. It now asks where the folder should go.

- **The tool list knows about every tool.** Five that exist were missing from it,
  so anything asking "does this tool exist" got the wrong answer.

- **Discover download figures respect the platform filter.** Filtering to one
  platform still summed the downloads of all of them.

## v12.5.76 - Two Corrections

A light window stays light when you have picked your own colours, and connecting
a Google Calendar works on an account made after 2022.

### Fixed

- **Light mode with your own accent colours.** Switching to light while a custom
  accent was set left the dark background in place and turned the text dark with
  it: a page you could not read. The colours are worked out again the moment you
  flip the switch, which is the step that was missing. If you are on 12.5.75 and
  see this, "Back to the original" in Settings clears it at once. Nobody who kept
  the shipped colours was affected.

- **Connecting Google Calendar.** Google stopped accepting the copy-the-code
  redirect for any OAuth client created after 2022, so a new client could not
  finish the connection at all. Skales now sends Google back to a small page of
  its own on your machine, which shows the code with a copy button. Step two in
  Settings is unchanged: paste it and you are connected. Nothing to register on
  Google's side, because a desktop client may use any local address. An older
  client keeps working exactly as it did.

## v12.5.75 - Extensions

Skales says out loud that you can build onto it, and the Code window stops
tripping over its own defaults.

### Added

- **The Extensions pill.** The Code composer has a new toggle next to the
  attachment clip. Switch it on and the session knows, precisely, how Skales is
  extended: how a capability that worked once in chat becomes a permanent tool,
  how an app you build is registered as an API Connector Skales can call, how
  your app calls into Skales over the DevKit remote API, and how an MCP server
  plugs its tools straight in. The contracts are spelled out in the prompt, so
  a small local model can follow them as well as a frontier one. The tooltip on
  the pill says all of this before you press it.

- **Skales knows it is extensible.** Asked "how do I extend you?" in any chat,
  Skales now answers with the real routes above instead of guessing at ports
  and reverse-engineering. The one honest limit is stated too: no injecting
  panels into the Skales window itself; a companion window wired over the
  connector and the remote API is the way.

- **A Debian package.** Debian, Ubuntu and Mint have a proper `.deb` again,
  next to the AppImage that runs on any distro. It is the one to take on
  Ubuntu 24.04 and newer: installing it keeps the Chromium sandbox switched on,
  where the AppImage has to fall back without it.

### Changed

- **Home and Work reach every theme.** Obsidian, Snowfield and Neon had no way
  to switch sides, so the sidebar was stuck on whichever one another theme had
  left behind. All three carry the switch now and group their entries by it,
  under the same headings as the full sidebar.

- **Codework and Swarm start switched off.** Both are a deliberate step rather
  than something to meet on the first launch: one runs commands and writes
  files in a real project folder, the other sends one task to several models at
  once. Turn either on in Add-Ons whenever you want it. An existing install
  keeps exactly what it had. Swarm also moves out of Main and down to Build,
  under WordPress, with the rest of the ways to run a job.

### Fixed

- **An answered question stays answered.** The occasional question Skales asks
  about how you work came back on the next reload, in full, as if you had never
  replied, sometimes days later with the old timestamp still under it. Your
  answer is kept with the message now. The same reload used to make the
  small "shape your agent" card disappear instead; it stays too.

- **Your accent colour reaches the rest of the app.** Around fifteen hundred
  buttons, links, icons, headings, rings and glows were painted in the shipped
  lime by hand and never moved when you picked a colour. They follow the accent
  now, including the tinted glass behind the panels, which takes on your hue
  while keeping its own depth. Green that means something, like a success tick
  or an online dot, stays green.

- **The Skales lettering is the logo again.** Under Obsidian it came out sand,
  under Snowfield blue, under Neon cyan, and elsewhere it followed whatever
  accent you had picked. The wordmark is the brand and no longer takes a colour
  from anything.

- **The stripe on the active sidebar button.** The pill in the default theme
  had a hard line down its left edge in a colour from the far end of its own
  gradient. It is one smooth pill now.

- **The accent belongs to Skales-X.** The other five themes are finished
  designs with an accent chosen against their own palette, and half of each
  stayed behind when a picked colour was walked through it. They keep their own
  accent; the picker says where it lives.

- **A coding session without an agent runs again.** "No agent" is the Code
  window's default for a reason: no persona, no extra prompt, fewer tokens.
  A session started on that default aborted immediately with "Isolated agent
  could not be resolved", and only picking a real agent got it moving. The
  default works now, and sessions broken this way heal on their next message.

- **Code stays in the Code window.** A run in the standalone Code window used
  to follow you into the app: clicking Chat landed you inside the coding
  session, its approval card and live stream included, and the coding session
  sat in the chat History as if it were a conversation. Code sessions now live
  with Code: the chat page, its recents, History and the command palette leave
  them out, and a finished coding run notifies with "Open Code" instead of
  posing as a chat reply.

- **The type size buttons in the Code settings size the type.** Every size in
  the window scales with the chosen number; before, the family changed and the
  size did nothing.

- **The composer's toolbar scrolls instead of wrapping.** The row under the
  input keeps one line at any width; a mouse wheel now scrolls it sideways,
  alongside the drag and trackpad swipe it already had.

## v12.5.71 - Windows You Can See Through

Two corrections to 12.5.7. Both are things you look at every day, and both were
caused by a rule that was right for the windows it was written for and wrong for
the ones it also reached.

### Fixed

- **Buddy is see-through again.** 12.5.7 gave each window the right to colour its
  own title bar in the current theme, so Flow and Code stop showing a dark
  caption bar in a light theme. Two windows have no title bar and no background
  at all - the desktop Buddy and the AIPointer overlay - and they were filled in
  along with the rest: a solid rectangle in the theme colour, sitting on your
  desktop. A window whose pixels come from the page is now left alone, and Flow
  and Code keep the caption bar that matches their theme.

- **The Home | Work switch obeys the click, not the page you are on.** The
  sidebar follows you: land on a page only one side shows, and it turns to that
  side so the page you are on is always in the menu. That rule was also
  answering your own switch. On Discover - a Home page - pressing Work set the
  side and the rule put it straight back, so the only way from Discover to Code
  was a detour via a page both sides show. The rule now answers a move between
  pages, once. Standing still, the choice is yours.

## v12.5.7 - Code Gets Its Own Window

Code stops being a page inside Skales and becomes a program of its own: a
window built for working on a repository, built for that job rather than for
a conversation. Point it at a folder, watch it read, plan and
ship the diff, review every change beside the transcript, and tell it - once,
globally, or per session - how you like to work. It runs the same engine as
everything else and none of the identity: a coding agent, and nothing else.

### Added

- **Hugging Face works the way it looks like it works.** The token test can
  actually fail now - it checks who you are and then makes one real call, so a
  made-up token stops passing - and a rejected token says which permission it is
  missing, with a link straight to the page that sets it. Activating a Space
  reads that Space's own API instead of guessing at it, and when a Space will not
  answer, the card says the shape was guessed rather than pretending otherwise;
  you can correct the endpoint, the inputs and the output type by hand, or have
  the API read again. Spaces built on current Gradio work, not only the old
  ones. A Space that returns a file returns a picture, a video or a sound you can
  see, saved into your gallery rather than handed to you as a link that expires.
  Speech-to-text and text-to-speech can both run through Hugging Face. Embeddings
  work. Music is no longer one single model. A dedicated endpoint is tested as
  the kind of endpoint it is instead of always as a chat. And the model catalogue
  is read properly at last: prices, context sizes, tool support and the real
  providers behind a model, instead of a list of the people who uploaded it.

- **Remote MCP servers speak the current protocol.** Skales now offers the
  2025-06-18 revision and falls back to 2024-11-05 for a server that has not
  moved yet, so servers that had begun refusing the older revision connect again.

- **Skales Code has a terminal, and it is yours.** A real one, under the box you
  type in and dragged to whatever height you want: your login shell, in the
  session's folder, with your profile. Not a command field, so vim, top, an
  interactive prompt, colours, arrow keys and Ctrl-C all behave the way they do
  in a terminal. Several tabs if you want them, a switch in the title bar, and
  /terminal. It is yours in the sense that matters: the agent can neither see it
  nor type into it, so it needs none of the agent's rules, and what the agent
  runs has its own place further down.

- **A command that never ends can run in the background.** A dev server, a
  watcher, a long build used to be a choice between a timeout and a blocked
  session. Now it starts, hands back a handle, and keeps going: its output
  appears under the step that started it and grows while you watch, and a strip
  above the status line lists everything that is running with what it is, how
  long it has been going, and a stop button. Nothing limits how many run and
  nothing times them out. Stopping really stops it, the whole tree, so a port
  actually comes free. A session that ends ends its own, and so does closing
  Skales. Your phone can see the same list and press the same stop.

- **Call any API from Skales.** A tool for talking to a REST API or submitting a
  form: your method, your headers, your body, the answer back. A form-shaped
  body is sent as a form, which is the difference between a request that works
  and one that quietly does nothing. Reading runs, writing asks first. Your own
  network is reachable, a NAS or a second machine or a service in your tailnet;
  this computer itself is not, because that is where Skales listens, and a page
  or a document could otherwise talk it into calling the app. A switch under
  Security opens that too, and says why it is shut.

- **A template for Code opens Code.** Clicking a coding template used to open Lio
  AI, and the card said so. It opens Skales Code now, with the prompt already in
  the box. Five new ones for the work a developer actually brings: find and fix
  this bug, review my current changes, explain this codebase to me, refactor this
  safely, find what is untested and test it. Each of them insists on running the
  thing rather than claiming it.

- **The instructions box shows what belongs in it.** The place where you tell
  every coding session how you work was an empty field with no example. It now
  hints at the four things that earn their place there: the language to answer
  in, your own test command, your commit style, your no-gos. A hint, not a
  filled-in file: rules nobody wrote should not ride along invisibly.

- **Working in Code shows up in Discover.** The biggest thing in this release had
  no place in the feed at all. A coding session, a change shipped out of the
  window and a run with several agents now do, in the same content-free shape
  the Studio entries have: never a repository, a branch, a path, a commit message
  or a file count. The feed is public and the work is private.

- **Code is its own program now.** Clicking Code opens a window that looks and
  behaves like a tool for writing software, not like a chat with a folder
  attached. Its own title bar, its own type, its own light and dark, and a
  status line along the bottom that always says what is going on: idle or
  working, which folder, which branch, and how many lines it has added and
  removed. Point it at a repository and say what you want changed. You can open
  a project on this computer or clone one from an address, an ssh address
  included, and the sessions you had open before are listed underneath with the
  branch and the size of the change in each. Four ways to work: Ask reads and answers
  and changes nothing, Code makes the change, Plan writes out what it would do
  first, Auto gets on with it. Pick the model and how hard it should think right
  there in the box you type into.

- **A coding session reads like a log, not like a conversation.** The Code
  window shows the whole session in one column: what you asked, what it
  answered, and every step in between as its own line. Read, Grep, Edit, Bash,
  with the file or the command beside it and how many lines it added and
  removed. An edit shows the change right there, the lines it replaced in red
  and the new ones in green, with the line numbers from the file. A command
  shows its output in a terminal block underneath. The checklist it is working
  through updates in place, with the finished items struck out. It fills in as
  it happens rather than all at once at the end, and scrolling up to read
  something earlier no longer drags you back to the bottom every second.

- **Your coding sessions, down the side.** Code has a column you can open from
  the title bar: a new session at the top, a search that looks at both the name
  and the repository, and everything you have worked on grouped into today and
  earlier, with the repository and what changed under each. Right-click one to
  rename it, put it away, duplicate it, download the whole session as a
  readable file, or delete it. A duplicate brings the conversation with it, so
  you can try a second approach without losing the first, and the download
  includes the diffs, because a record of a coding session without the changes
  in it is a record of nothing. A new session is named after the first thing
  you ask it rather than after the folder, which the row already tells you.

- **Review what changed, then ship it, without leaving the window.** Open the
  review panel from the title bar and the changed files sit beside the
  transcript. Pick one and you get it three ways: the change itself with line
  numbers, the file as it now reads, and, for something worth looking at like a
  markdown file or an image, a real preview. Keep it or put it back, write a
  commit line, and open a pull request: the branch is pushed and the request is
  created for you, with GitHub's own words back if it refuses. It needs the
  GitHub command-line tool signed in, and says so plainly when it is not there
  instead of just failing. Underneath, everything this session changed with a
  way to undo any single one of them, and the repository's other checkouts.

- **Point at a file, drop in a screenshot, or just type a command.** In Code,
  typing @ offers the files of the repository you are in, matched on the whole
  path so a folder name finds them, and the file goes along with your message
  so it does not have to go looking. Drop files onto the box, paste a
  screenshot, or use the paperclip: video, audio, PDFs and archives all attach
  the way they do in a chat, with the chat's limits and no new ones, and they
  show as chips above what you are typing, with their size and a thumbnail for
  a picture. A slash at the
  start of the line opens the short list of things a coding session can do:
  switch how it works, open the review panel, commit, open a pull request, stop
  it, start a new session. A slash anywhere else is just a path, and stays one.

- **When it stops to ask, the question is right there.** A question from Code
  now appears in the session itself, with its options numbered so you can
  answer with a keypress, or write something else entirely in the box below.
  When a tool wants permission, the same: what it wants to run, and Allow once,
  Deny, or stop asking about that tool for this session. While either is open
  the header and the bottom line both say it is waiting for you, and the box
  says so too instead of quietly doing nothing. A question you already answered
  stays readable but can no longer be clicked, so an old card cannot answer a
  question the session has long moved past.

- **The status line now counts the context, and a picture you sent shows as a
  picture.** The bottom line of the Code window shows how much of the model's
  window the conversation occupies. A message that carried screenshots or files
  shows their names as small chips instead of raw text, an agent's log can be
  opened from its card, the review panel says when a very long change was cut
  short instead of ending silently, and a message typed in the last moment of a
  run is carried into a fresh run instead of quietly disappearing.

- **Answers read the way they were written.** Text from Code renders properly
  now, so a filename in code marks, a bulleted list of findings or a snippet
  comes out looking like what it is, rather than showing you the asterisks.

- **Watch several agents work at once, and see what they cost.** When a coding
  session splits a job across parallel agents, Code shows them down the right:
  what each was asked to do, how long it has been going, how many tools it has
  used, and its answer when it has one. Underneath, what the run has spent, split
  between the main conversation and the agents, with a total. Stop all is in the
  header while any of them is running. A figure that was never recorded says so
  rather than showing a zero that would read as free, and from now on those
  figures are recorded, including for a run that spent them and then failed.

- **Code is a coding agent, and nothing else.** A session in the Code window no
  longer carries Skales' personality, its interests, or anything it remembers
  about you. It is told where it is, what it may change, which shell this
  machine runs, and how to work, and that is all. Measured on a real request:
  the instructions it sends dropped from about 13,800 characters to about
  4,200, which is roughly seventy per cent less on every single turn. It keeps
  the whole toolset, because a coding agent with fewer tools is a worse one;
  what it loses is the handful that read or write your memory, refused both in
  what it is offered and in what it may run.

- **Tell it how you like to work, once.** The gear in the Code window holds
  instructions that apply to every coding session, here and behind the /code
  command in chat, plus instructions for just this session when one job needs
  something different. Alongside them it shows what the project itself asks for
  in its own CLAUDE.md or AGENTS.md, read-only, because that file belongs to
  the repository. The more specific one wins. The gear also holds light and
  dark for this window, and follows the system if you would rather it did.

- **A phone will be able to tell a coding session from a chat.** The session
  list Skales sends to a paired phone now carries, for a coding session, the
  folder it is in, how it is working, whether it is running or waiting for you,
  and how much it has changed. Nothing on the phone uses it yet; it is there so
  that when it does, it draws the same row this Mac draws instead of a second
  version of it.

- **It hears you while it is working.** Type while a session is running and the
  message waits in line instead of being refused; it is picked up at the next
  step and the count of what is waiting is on screen the whole time. Everything
  the window can do it does through the same channel a phone will later use, so
  the same session can be watched and steered from somewhere else without any
  of it being built twice.

- **Code sessions show up again on a machine you have been using a while.** The
  list of coding sessions was empty for anyone whose conversation list had been
  built before Code existed, because the saved list did not know what a bound
  folder was. It is rebuilt once, and they are all there.

- **Code moved up, and can be put away.** Code now sits in the main part of the
  sidebar, directly above Studio, where the work you do every day lives. And
  like Studio it is an add-on: if you do not write code, switch it off under
  Add-Ons and the entry is gone. It is on to begin with.

- **Code: a place to work in a folder.** A new entry in the sidebar opens Skales
  on a folder of your choosing, in its own window, so you can keep chatting and
  using everything else while it works there. It lists the folders you have
  worked in before, and you pick how it should behave: Code changes files and
  asks before anything risky, Plan only reads and shows you what it would do,
  Auto gets on with it. It is the same engine that has been behind the /code
  command in chat, with a surface of its own. Pick a session and you see the
  repository it sits in: the branch, how far ahead or behind it is, every
  changed file, and a box to commit them. A folder that is not a repository
  says so rather than showing an error, and when git refuses a commit you get
  git's own words back, not a generic failure. Click any changed file and you
  see what changed in it, with Keep and Put back: Keep stages it for the next
  commit, Put back restores the file the way it was and tells you where it took
  the old version from. A brand new file shows its contents instead of an empty
  comparison. Alongside it there is a list of every file this session wrote,
  changed or deleted, each with its own undo, and the ones you already undid
  stay in the list so the record stays complete. And you can work on two things
  at once: give a second piece of work a name and Skales checks the repository
  out again in a folder of its own, on a branch of its own, with its own
  session, so neither run can overwrite the other. Each session says whether it
  is working, waiting for an answer from you, or idle. Removing a parallel
  checkout tells you when there is uncommitted work in it rather than taking it
  with the folder, and it will never remove the repository itself.

- **Your accent colours stop at the logo.** Custom accents recolour buttons,
  links, glows and selections; the Skales lettering in the sidebar keeps its own
  colours in every theme, because that is the brand, not a control.

- **Your own accent colours.** Under Appearance you can now set the three
  colours the Skales gradient is made of, and everything drawn in the accent
  follows: buttons, links, the glow, the selected row, the wordmark, the command
  token in the composer. Skales adjusts the brightness where it has to so the
  result stays readable on the page you are on, tells you when it did and by how
  much, and one click puts the original colours back. The window frame of the
  Flow and Code windows now follows the theme as well, instead of staying dark.

- **A team plan shows who waits for whom.** The team leader has always decided
  which subtasks can run at once and which have to wait for earlier results, and
  the run has always followed that - but the plan was printed as a flat list, so
  five agents working in parallel looked exactly like five agents working in a
  chain. The plan is now drawn in stages, each stage saying how many run
  together, and a subtask that waits names what it waits for.

- **Skales says when it shortens a long conversation.** To keep a long chat
  inside the model's limit, Skales summarises the older part of it. That has
  always happened quietly, so from the outside it just looked like the assistant
  starting to forget things. It now says so in the conversation, with what was
  shortened, and makes clear that nothing was deleted.

- **Sub-agents get a role instead of everything.** When Skales splits a job into
  parallel sub-agents, each of them was handed the complete tool set: a
  sub-agent researching competitors could send WhatsApp messages, write to your
  long-term memory, stop to ask you a question, and start sub-agents of its own
  without end. Three of those are now impossible for a sub-agent whatever else
  changes, and a sub-agent that needs a capability it was not given can ask for
  it mid-job and carry on. The narrower tool sets themselves are off by default
  for now and can be switched on in settings; while they are off, every request
  a sub-agent makes is recorded, so the defaults are chosen from what jobs
  actually needed rather than from a guess.

- **Your own speech server, for reading aloud and for dictation.** There was a
  field for a custom text-to-speech address, and nothing in Skales ever read it:
  it was saved, carried along and backed up, and it never produced a sound.
  Settings now has a Custom voice provider with the four things such an endpoint
  actually needs, an address, a model, a voice and an optional key, and the same
  for transcription. Both are used before any cloud service, because a server
  you set up yourself is the one you meant. An address you had already entered
  in the old field starts working on its own, and if your endpoint does not
  answer, Skales says so instead of quietly reading in a different voice from
  somewhere else.

- **Folders Skales must never touch, whatever else you allow.** Until now the
  only way to limit file access was to list what Skales *may* reach, which is no
  help if you run it with Full Access on purpose. There is now a list of folders
  it must stay out of, and that list is not lifted by Full Access or by
  Unrestricted mode. It covers the file tools, the shell and scripts, search,
  and directory listings, so a blocked folder is not just unreadable, it is
  invisible; it cannot be picked as a project folder either. Shortcuts pointing
  into a blocked folder are followed before the check, so they are not a way
  around it. One button blocks Skales' own program folder without you typing a
  path, which also means it keeps working after you move the app.

- **Every step in a coding session opens.** A line in the Code window is no
  longer something to read past. Click a Read, a Grep, an Edit or a command and
  it unfolds: exactly what was sent, and everything that came back, whole,
  scrollable and with a copy button on each half. The line itself now also says
  how long the step took, so a slow turn shows you where the time went.

- **A change decides itself where you see it.** The diff under an edit carries
  its own added and removed counts and its own Keep and Revert, so reviewing no
  longer means finding the same file again in the panel.

- **Every file is a link.** A path in a tool line, a path an answer mentions in
  backticks, a file in a diff: click it and it opens in the panel beside the
  transcript. That includes the Markdown ones.

- **Something to do with a turn.** Under every answer: copy it, have it read out
  loud, fork a new session from that point, or roll the whole session back to
  it, files included. Under your own turns: change what you asked and send it
  again. Your own words now sit on the right, in a block of their own.

- **A page you wrote, running beside the transcript.** Click an HTML file in a
  coding session and the panel does not show you its source, it shows you the
  page: its own stylesheet and script load with it, so a widget or a small app
  works there the way it will work anywhere. Markdown is rendered, images are
  shown, and everything else is now coloured instead of one grey block.

- **Point at something in a running page.** Turn on the picker, hover the page,
  click what you mean, and the element goes onto the message you are writing:
  what to call it in CSS, its own markup, and a picture of just that piece. So
  "change this one" is a thing you point at rather than describe.

- **Chat or Split, from the title bar.** The panel used to be reachable only
  when git had noticed a change, which has nothing to do with wanting to look at
  a file. Now it is a switch, and it is there whenever a session is.

- **Hand a coding session over to Code.** A chat that is bound to a folder and
  running in a code mode gets one button in its header: it stops what is
  running, cleanly, and opens that same session in the Code window. Not a link
  and not a second copy. The same session, in the window built for it, with
  your chat left exactly where it was.

- **The landing says something different every time.** Twenty-two greetings, in
  every language, in rotation rather than at random, and the headline flickers
  for a moment every few seconds. It holds still for anyone who has asked their
  computer for less motion.

- **Dictate into the box.** A microphone in the composer, running the same
  speech-to-text everything else in Skales runs. What it hears joins what you
  already typed instead of replacing it.

- **Which agent runs the session, next to the model.** By default: none. An
  agent carries a system prompt and a persona, and a coding session should have
  neither unless you deliberately picked one. If you do pick one, it is that
  agent's prompt from the next turn.

- **The Skills button says what else is connected.** Which MCP servers are on
  and how many tools each one brings, and which connectors are set up, instead
  of leaving you to wonder whether any of it reached this window. A step that
  went through an MCP server now says which one.

- **A message you send from your phone while it is working joins the queue**
  instead of starting a second turn on the same session.

- **Two files for your standing rules, not one.** SKALES.md is still how you
  want to be answered, everywhere. AGENTS.md is new and is about code only: the
  style, the checks to run, the folders never to touch. One editor in Settings,
  a switch above it, and both are ordinary files you can open in a text editor.
  A project's own CLAUDE.md still wins for that project.

- **Look at what you published.** Two new tools alongside the FTP upload that
  has been there for years: list a directory on your server, and download a file
  from it. Same saved profiles, all three protocols, and an agent working on its
  own website can finally read its own files back.

- **Every coding session gets a scratch folder of its own.** Somewhere to put a
  captured log or a half-finished file that is not part of your repository and
  should never show up in your diff. It is emptied when you clear the session and
  deleted when you delete it.

- **`/clear` in Code.** Empties the session and its scratch folder and keeps the
  repository, because starting again almost never means starting somewhere else.

- **The sidebar has two sides now: Home and Work.** A switch under the provider
  status, and the menu regroups: Home leads with Chat, History, Discover, Memory
  and Lio AI and keeps Browser, Group Chat, Spaces and Wrapped together; Work
  leads with Code, Organization, Autopilot, Teams and Swarm and puts Codework,
  Browser, Playbooks, Workflow and WordPress under Build. Workspace, your own
  widgets and System stand in both. Your choice is remembered, and collapsed the
  switch becomes one button showing the side you are on.

- **Skales asks once how you want to use it.** A single question after the
  privacy notice, with two equal answers, and all it decides is which half of
  the menu you see first. Skippable, and changeable any time.

- **Code pulses once, quietly, if you have not opened it yet.** It stops the
  first time you click it and does not come back in the next release.

- **Hand a design to a coding session.** The paperclip in Code now offers a
  Studio or Flow project as well as files: pick one and the session gets a
  snapshot of it, the markup, a list of the files it is made of, and a picture
  of how it looks. Read-only, so the session can match it and never write into
  it. So the thing you designed and the thing you are building can finally see
  each other without an export in between.

- **No emoji in Code, at all.** Where a step or an answer arrives carrying a
  tick, a cross or a warning sign, the window draws its own icon and keeps the
  meaning. Everything else is removed, and Code is told not to put emoji in the
  files it writes either.

- **Code follows Skales, not your Mac.** Light stays light and dark stays dark
  because of what Skales is set to, and it changes the moment you change it,
  even with the Code window open beside the main one.

- **Skales Code has a browser, and the project's files beside it.** A page the
  agent just wrote, a dev server it just started, a file you want to look at:
  there is a panel for that now, next to the transcript rather than instead of
  it, with an address bar, back and forward, reload and open-in-your-real-
  browser. The file column lists what is in the folder and opens it with a
  click. Its own panel, because "what changed" and "what does it look like" are
  two questions and the review panel only answers the first.

- **A page printed in the answer can be run where it stands.** When Code writes
  a whole HTML page and shows it to you, the block carries two tabs: the source,
  which is still what opens, and the page itself, running. No copying it out to
  a file to find out whether it looks right.

- **The panels on the right can be dragged wider.** Both of them, from their
  left edge, with the mouse or with the arrow keys, and each window remembers
  what you set.

- **New coding sessions start on what you choose.** The gear in Code now holds
  the defaults: which model a new session opens on, which agent runs it, and
  which working mode it starts in. Nothing there touches a session that is
  already open. Beside them, how the window reads - the typeface and the size -
  which stays on this machine.

- **Code says what it is allowed to do.** The settings panel now states, in
  words, that a coding session runs on the working mode you pick in it and not
  on the safety mode in Settings, what each mode asks about, and the five things
  no mode lifts: the folder is never left, Skales' own files are never
  writable, commands that cannot be undone are refused, and a coding session can
  neither read nor write your memory.

- **Skales itself can run a coding session.** The agent list in Code offered
  every agent on the machine except the one the chat window runs on. It is
  there now, second in the list, for when you want Skales with its memory on a
  repository rather than the lean coding identity.

### Changed

- **All eighteen AI providers are on the providers page, not four.** OpenAI,
  Anthropic, Google, Groq, Mistral, DeepSeek, xAI, Together, Minimax, Moonshot,
  GLM, Qwen, Cloudflare and Nvidia were folded into a collapsed "More LLMs"
  section, so the one page that answers what Skales can talk to showed you an
  aggregator, a local runner, a text field and a router. They are all listed
  now, in a sensible order, and the "show only active" checkbox above the list
  is there when you want it short. The cards themselves used to be built twice,
  in two places that had drifted apart three times in past releases; they are
  built once now, so a button can no longer exist for half the providers.

- **Lio AI now has an address that matches its name.** The sidebar entry read
  "Lio AI" while the page it opened lived at /code, so links, bookmarks and the
  assistant's own answers about where things are all pointed somewhere that
  said something else. Lio AI is at /lio from now on. An old /code link still
  takes you there, so nothing you saved stops working.

- **Code asks you, not your safety mode.** The leash is the mode you picked when
  the session started: Ask and Plan read, Code asks before anything risky, Accept
  edits applies file changes and still asks for the shell, Auto runs. Set the
  rest of Skales to Unrestricted and Code still asks, because that is what
  choosing Code meant. Nothing that is not a question changes: the blocked
  folders, staying inside the bound folder, the command block and the shell rules
  were never approvals and are never lifted.

### Fixed

- **A mailbox that refuses your password by design now says which code to get.**
  QQ never accepts an account password over IMAP, it issues a separate
  authorisation code, and Skales answered "verify credentials", which sends you
  to check the one thing that was already right. QQ now gets the sentence that
  helps, in the words its own settings use, and so do 163 and 126, GMX, Web.de,
  iCloud, Zoho and Yandex: each names what to get and where. A provider that is
  not on the list at least learns that this is a thing that happens. And a
  failure that arrived as one word, "AggregateError", now says what actually
  went wrong on each address it tried.

- **The mail test button works before you save, and says what it does.** It was
  dead until the account was stored, which is backwards: testing is what you do
  before committing settings you are unsure about. It now checks what is in the
  form, and it says out loud that it only checks the login, sends nothing and
  changes nothing in your mailbox.

- **Searching a project no longer stops everything else.** Skales runs on one
  loop and every chat, poll and button shares it. A search across a source tree
  held it for a quarter of a second in one block and listing a project held it
  on every session open, so a running conversation stuttered for reasons that
  had nothing to do with it. Search, listing, reading and the project walk now
  give the loop back while they wait.

- **You can watch the browser work instead of seeing the pictures afterwards.**
  A screenshot only travelled with the finished tool result, so a browsing job
  of a dozen steps left the chat empty for a minute and then dropped every still
  in at once. The current picture now appears above the composer while the job
  runs and updates with each step, and it disappears when the run ends rather
  than sitting there looking live. The screenshots in the conversation are
  unchanged.

- **Skales can offer to turn a long answer into a goal, and it asks first.**
  The automatic goal start could only judge a message before it ran, so a short
  request that turned into fourteen open steps and thirty tool calls was never
  recognised as the bigger job it became. When a finished turn ends with several
  open steps, a lot of tool work, or an unfinished checklist, a line above the
  composer offers to carry it on as a goal. It never starts by itself: one click
  runs it, one click makes it go away, and doing nothing leaves the chat exactly
  as it was. When you have switched on the automatic start, a promoted message
  now says so in the conversation instead of only in a log, and neither half of
  this runs inside an isolated agent.

- **A team task that stops moving ends, and tells you where it stopped.** If a
  step never came back, the task stayed on "running" for as long as the app was
  open, and the log only listed which tools had been called, never what came of
  them. A step that produces nothing for six minutes is now given up on and
  marked as stopped, which is its own outcome and reads differently from a step
  that failed. The log lines carry the result of each tool, and a failed one
  says what went wrong right there in the timeline. The clock restarts on every
  answer, so a long task that keeps working is not interrupted.

- **The updater cannot install a version that is no longer the current one.**
  It checked for updates every four hours and then treated that answer as
  settled: the download took whatever the last check had named, and the install
  checked nothing at all beyond the file being there. On release day that meant
  two machines installed the previous version half an hour after the new one had
  gone out. Skales now re-reads the release feed before it downloads and again
  before it installs, and if the download has been overtaken it says so and
  offers the current one instead of installing the old one. When the feed cannot
  be reached, an already-downloaded and verified update still installs, and the
  log says it could not be re-checked rather than pretending it was.

- **A team task keeps its files together instead of on your Desktop.** The
  agents in an Execution Team were never given a place to work, and their
  instructions literally told them to save to the Desktop or the home folder,
  which in unrestricted mode is where the files ended up. Each run now has its
  own folder under the workspace, the agents are told to write there, and the
  run says which folder it is before it starts, so you can find the result.

- **Flow keeps its Render button after the first render, and you can start one
  from the chat.** Once a Motion project had been rendered, the button was gone:
  the preview had switched to the finished video, and the button only appeared
  while an HTML composition was on screen. It belongs to the project now, not to
  whatever file you happen to be looking at, and clicking it puts the
  composition back in the preview so you see what is being rendered. When it
  cannot run, it stays visible and greyed out with the reason on it, including
  on a machine where FFmpeg is not installed, instead of quietly not being
  there. The same action is now on the file card in the conversation, where the
  round that produced the composition is.

- **The Execution Team room is visible in a light theme.** The scene was drawn
  in white on the assumption of a dark room, so in Snowfield, or in any theme
  set to light, the desks, the people, the monitors and the names were white on
  white and the panel looked empty while a team was working in it. It is drawn
  in your theme's colours now and follows a theme switch immediately. The same
  thing hid your own dot on the Discover network map; it shows up too.

- **"Fetch Available Models" works on providers where it never could.** The
  button asked the provider directly from the window you were looking at, and a
  browser refuses that unless the provider explicitly allows it. Most do not, so
  the request never left your machine and the card reported a failure on a key
  that was fine. Nvidia NIM was where it was noticed; it was true for a dozen
  providers. The request now goes out from Skales itself, and when a provider
  does refuse, the card shows you what the provider said instead of a generic
  error. The model picker in chat was quietly affected by the same thing: it
  promised your actual models and fell back to a fixed list without saying so.

- **The Debug Panel works again on all five of its tabs.** Memory, Sessions,
  Tools and Status all answered with an authorization error, because the panel
  called the developer API with a token it had guessed rather than the one in
  your own DevKit config. Only the Adaptive tab worked, and only because it was
  the one tab that read the app directly. All five read the app directly now, so
  the panel shows you your machine whether or not the developer API is switched
  on. The API Playground stops guessing too: it fills the token field from your
  config, and says so plainly when there is no token to fill it with.

- **Settings no longer shows you the name of a text instead of the text.**
  Four provider cards printed something like settings.providers.nvidia_nim.desc
  where their description belongs, and all six theme cards in Appearance showed
  the word "Appearance" as their description. A few other places did the same
  thing: the standing instructions panel, the day picker in Planner, the refresh
  button on the Autopilot board, and four of the twelve voice languages in
  Studio. All of them now say what they mean, in all twelve languages, and a
  check now fails the build if a text is referenced that no language actually
  has, so this cannot come back unnoticed.

- **The desktop buddy now wears the theme you picked, and its bubble can no
  longer be cut off.** Four things were wrong with that little window at once.
  It ignored the theme system completely: it carried its own fixed set of
  colours and reduced every theme you can choose to a single light-or-dark
  guess, refreshed at most twice a minute, so it never matched the app and
  lagged behind a theme switch. It now reads the same colours as everything
  else and follows a change the moment you make it. In a light theme the
  "Open Chat" link was white text on a white bubble - invisible until you
  hovered it, which made it whiter; the speech tail stayed dark under a light
  bubble too. Both follow the theme now. The action button on a notification
  ("View Tasks", "Open calendar") did nothing at all when clicked; it now opens
  that page in the main window, and a notification without a page opens the
  chat rather than nothing. And the window itself was a fixed height that could
  not grow, with the page hiding anything that did not fit - a long answer was
  not scrolled, it was cut. The window now grows to fit what it has to say,
  upward from wherever you parked it, never past the edge of your screen, and
  goes back to its normal size when the bubble is gone. If a message is longer
  than the screen can hold, the bubble scrolls instead of hiding the rest.

- **A chat that sends out sub-agents now shows them working while they work.**
  Handing a job to parallel sub-agents puts a live status card under the message
  that started it, one chip per agent. That card only turned up after leaving the
  chat and coming back, or after a reload, so a job that was very much running
  looked like nothing had happened. The launch signal never reached the open
  chat: it travels on the same internal channel as the proactive dashboard
  notes, that channel is read-once, and a single unreadable item made the read
  throw away the entire batch. The signal was gone before anything could act on
  it. The channel now hands over exactly what it promises, and one bad message
  can no longer take the rest down with it, so the card shows up within seconds
  and its chips move as the agents finish. Two more things that ride the same
  channel come back with it: the "job finished" notice with its per-agent
  report, and proactive dashboard messages appearing in chat. And a job sent off
  in the very first turn of an empty chat, where there is no message yet to hang
  the card on, now shows it above the input instead of nowhere at all.

- **A click in the built-in browser no longer gives up because the page redrew
  itself.** Reading a page marks every element so the agent can act on it
  exactly, but a site that rebuilds itself while it works - most modern ones do,
  constantly - throws those marks away, and the click then failed on everything,
  including a site's own logo, while typing carried on working. Skales now also
  remembers what each element WAS, its role and its label, which survive a
  redraw, and falls back to finding it that way. If even that misses, the
  remembered label is handed to the two strategies that were already there and
  were never reached before, instead of the attempt ending.

- **The browser window that opens by itself now says whose it is.** A visible
  browsing run opens a real browser window next to Skales, and then it starts
  clicking and typing on its own. Nothing said where it came from, so closing it
  was the obvious reaction - which ends the run. Skales now says, once, that the
  window is its own doing, that it will move by itself, and that it should be
  left alone until it finishes. The sign-in flow says the same, and now also
  points at the chat for telling Skales you are done, rather than leaving people
  hunting for a button in Settings.

- **"Flow finished" opens Flow instead of taking over the window you are in.**
  Flow runs in a window of its own, but the notification's button navigated the
  current window, so the main Skales window turned into the Flow workspace.
  It now opens or brings forward the Flow window, the way the Studio tab
  already did.

- **A rendered video no longer reports a check that never ran.** Validating an
  MP4 needs ffprobe, which was looked up on the system path - and an app started
  from the Dock does not inherit the path from your terminal, so it was
  regularly not found. The check then fell back to "the file is not empty" and
  still showed a green Validated, next to a resolution of 0x0, a length of 0.0s
  and 0 fps. Skales now looks for ffprobe where it looks for ffmpeg, including
  the places a manual install puts it, and when it genuinely cannot be found the
  card says the file was only measured by size instead of claiming a verdict.

- **The settings panel in Code stopped loading and started answering.** It sat
  on "Loading..." forever with nothing loading, because the instructions could
  not be read at all. They can be read now.

- **Tooltips in Code are no longer cut off.** The ones on the title bar opened
  upwards, out of the window, and the ones by the box you type in were painted
  over by the bar beneath them. They are drawn above everything now and nudged
  back on screen at the edges.

- **Code is quiet.** Every reply used to raise a notification and play the
  chime, in the coding window, about the coding window. Worse, the button on it
  navigated that window away to the chat and took the session you were watching
  with it. Notifications belong to the main window; Code does its work without
  interrupting you.

- **The agent list in Code shows four and scrolls.** It opened as a column of
  every agent you have, over the transcript you were choosing it for.

- **A model picked in the Code window is the model that runs.** The Code model
  in Settings quietly overrode it, so the picker showed one name while the run
  used another. The setting still applies where it should: to /code in chat, and
  to a session that has no model of its own.

- **A Discover mention obeys the box that says it should not arrive.** With
  notifications muted and both Discover types switched off, mentions and replies
  still filled the dashboard. They were arriving under a name nothing here
  recognised, so every Discover setting let them past. Three places read that
  list and all three go through one check now.

- **An emoji in Skales is Skales' emoji.** The agent faces in Code were drawn by
  the operating system, so the gecko looked like Apple's gecko. And a lookup
  fault meant most hearts, hands and weather fell back to the system everywhere
  in the app, not only there. Both are fixed, and the coding agent wears a
  laptop, which is a face Skales can actually draw.

- **The sidebar breathes evenly.** The gap under the provider box now matches
  the one above it, and with the sidebar collapsed the Home button is exactly as
  wide as the box above it.

- **Chat and History are in Work as well as Home**, in the same place, and the
  sidebar always shows the page you are on: opening Discover from a notification
  no longer leaves the menu with nothing marked.

## v12.5.6 - An Answer You Can Actually Give

Being asked a question is no use if the form has nowhere to put your answer.
Skales could ask you four things and accept none of them, and the setup screen
for browsing the web reported itself ready on the same page that said it was
not. Both were the same kind of fault: something reported a state instead of
checking it.

### Added

- **Skales can speak on your phone in a voice from this Mac.** This computer has
  dozens of voices installed, the premium ones included, and they cost nothing
  and never leave your own two devices. The paired app (2.5.6 and newer) offers
  them under Voice: pick one from the list this machine reports and it speaks
  for the phone over the pairing connection. Nothing is played on this
  computer's speakers - the phone asked for the audio, not for the room to hear
  it - and if this machine goes away mid-sentence the phone falls back to its
  own voice rather than going quiet. The same is available locally at
  /api/tts/say. A computer that is not a Mac says so instead of reporting an
  empty list of voices.

- **The Organization scene shows you who is stuck.** The office under a running
  team was decoration: wood-grained desks, a steaming mug, a bouncing ball you
  could kick. With six agents working, none of it told you which one had stalled
  without reading six labels. It has been redrawn around that one job. Colour
  now means state and nothing else - the furniture is near-monochrome and a pool
  of light on the floor under each desk carries the agent's status, readable
  across the whole panel before a single word is. The monitor is the status lamp,
  breathing while there is work and dim while there is not; the ring around an
  agent grows when the state changes instead of blinking, so a glance mid-change
  still reads correctly; and the chip under each desk shows the tool actually
  running rather than the word "Working". The mug, the bookshelf, the clock and
  the kickable ball are gone with it.

- **Instructions you write once, followed everywhere.** Telling Skales how you
  want it to work - answer in German, keep it short, never open with a
  compliment - lasted exactly one conversation, and the next chat started
  ignorant again. Code mode could read a project's own CLAUDE.md, but only with
  a folder bound, and that file is about a project rather than about you.
  Settings, under Chat & Code, now has a box for standing instructions. What you
  put in it travels with every conversation, with tasks and schedules that run
  while you are away, and with custom agents you built yourself. Two places
  leave it out deliberately: an isolated agent, which carries nothing of yours
  by design, and the internal calls Skales makes to itself, whose answers are
  read by the app rather than by you. A project's own CLAUDE.md is the more
  specific instruction and still wins for that project.
  The box is not the only way in. It is backed by a plain SKALES.md file in your
  data dir, the path is printed under the box, and editing it in a text editor
  is the same edit: the box re-reads the file whenever you come back to the
  window. If it changed on disk while you had unsaved text here, it says so and
  refuses to save over it, so the two ways of editing cannot quietly eat each
  other's work.

- **Right-click a key field and paste into it.** A password field in Settings
  gets its own menu - copy the value while it stays masked, reveal it, remove it
  - and the app suppresses the ordinary Cut/Paste one so the two do not draw on
  top of each other. Between the two, nothing offered to put a key *in*: the
  menu opened, showed three things you could do to a key you already had, and
  none of them helped when the key was sitting on your clipboard. Paste is in
  that menu now. It respects a selection, so pasting over a highlighted key
  replaces it, and the keyboard shortcut keeps working as it always did.

### Fixed

- **A page you visit cannot reach the Skales API on your own machine.** The
  local server is reachable from any page open in your browser, and that was
  being closed one route at a time: the same-origin check sat on 2 of 225
  routes. There is one shared check now, in front of every /api request, and it
  refuses exactly one thing - a caller that CLAIMS an origin which is neither
  this server nor your own machine, which is the shape a page on another site
  makes when it fetches your local port. Everything that is not a browser is
  untouched: the messaging bots, the relay, the CLI, the phone over your LAN and
  the app talking to itself all keep working, and each of them has a test. The
  image context menu had the same hole in miniature and no longer opens a menu
  for a message no frame on the page sent.
- **Discover stops passing its own template off as your model's work.**
  Composing a post gave the model 45 seconds, then quietly substituted a local
  phrase bank and returned it with no mark on it. With auto-post on, that
  template was published under your name as if your agent had written it. The
  ceiling is 180 seconds now - measured: at 45 seconds ten live models were
  being called dead, and at 180 seconds seven of them answered - the composer no
  longer gives up before the server does, a fallback draft says that it is one,
  and auto-post holds for it. Cloud versus local was also decided by a list of
  five provider names, so every provider added since counted as running on your
  own computer; the endpoint decides now.
- **The in-app guide is the guide the assistant reads.** The served copy of the
  guide, which is what fetch_skales_docs answers from, was five releases behind
  the source one while both showed the current version in their header. They are
  copied on every version stamp now, and the guide covers 12.5.1 through 12.5.6.
- **Muting notifications is now actually silent.** The switch promises no pings
  on any channel while everything still lands on the Notifications page, and
  those two halves were the leak. A notification is written to that page first
  and only then silenced, and the toast that pops up in the corner was being
  built from the page's own records - so muting stopped the browser
  notification and the messengers, and a toast and a sound came through anyway.
  In practice that meant a Briefing nudge and a Discover mention still
  interrupted you. The toast is a channel like the others now and falls silent
  with them. One exception stays, the same one the other channels make: a
  request that is waiting on your answer still reaches you, because silencing
  that would leave work stalled with nothing to show for it. What was silenced
  is not saved up either - unmuting does not empty the quiet period onto your
  screen; it is all on the Notifications page, where it always was.
- **A mention in the Discover feed stopped outranking your own settings.** It
  was filed at the urgency reserved for things that block work until you
  answer, which let it through Mute, through quiet hours, and past the limit
  you can set on how often Discover may ping - while still using up that
  limit's daily slot, so a mention could silence the normal feed ping. It is
  filed as ordinary now and obeys all three.

- **A question with choices no longer stops at the choices.** When Skales asked
  you something and offered buttons to answer it, the buttons were all there
  was. A question like "What is your name and what do you do?" came with four
  roles to pick from and no way to type a name, so the one answer being asked
  for could not be given - the card sat there, nothing moved, and the run looked
  like it had died. Every set of choices now ends with one you can write into
  yourself. The rest of the card caught up too: the short label a question
  carries is shown, and the line of explanation that comes with each choice -
  the part that tells you what picking it actually means - is shown under it
  instead of being dropped on the way to the screen. Questions asked before this
  release still open and still work.
- **Browser Control says whether it can browse, not whether it once could.**
  The setup screen read a note written the last time an install had gone well,
  and nothing ever revised it. So the panel could sit there marked ready while
  the same panel, a few lines further down, refused to open a window and said
  the browser was missing - and it was: the app had moved on to a newer browser
  build that had never been fetched. The screen now asks the question it was
  claiming to answer, every time you open it: would opening a page work right
  now, with the browser you have chosen. If it would not, it says which part is
  missing and offers the button that fixes it, instead of hiding that button
  because it believed everything was fine.
- **A failure to launch is no longer reported as a failure to install.** Any
  problem that so much as mentioned the browser engine was rewritten into "not
  installed", including the engine's own complaint that it could not find the
  browser it wanted. The advice attached to it sent you to the screen you were
  already looking at, to press a button that screen was hiding. Each of those is
  now named for what it is, and the advice names something you can do - fetch
  the browser, or switch to the one already on your machine.
- **Install Chromium can install Chromium.** The button had two ways to do
  nothing. With "Use full Chromium" turned on it took a shortcut meant for
  people using their own Chrome, reported success and downloaded nothing. And in
  the packaged app the downloader itself had not been shipped: the build keeps
  the parts of a library it can see being used, and the piece that fetches a
  browser is started in a way that keeps it out of sight, so the one build that
  needs the button most was the one where it failed. Both are fixed, and the
  button now confirms the result against a real launch rather than against its
  own exit code.
- **A privacy note stopped introducing itself twice.** The desktop screenshot
  notice began "Privacy: Privacy:", because the screen put a heading in front of
  a sentence that already carried its own - in whichever language you read it
  in. The heading the translation uses is now the only one shown.

- **The Nvidia model list is the models that answer.** Every entry was called
  once and checked: of the 118 the catalogue lists, 44 reply to an actual
  message. Three of the six that shipped had been retired - including the one
  labelled "(Best)", which is the first thing a new user reaches for, so their
  first message failed and read like the provider was down. The list is now the
  verified ones, fastest first, and two things it taught are carried with it: a
  model that appears in a catalogue is not the same as a model you can call, and
  a slow first token is not a dead model.
- **A retired model is reported as a model problem, not a setup problem.** Nvidia
  answers a request for a withdrawn model with the words "404 page not found" -
  no code, no JSON - and that was surfaced as though the connection or the key
  were wrong, sending you to check settings that were fine.
- **The curated model picks are the ones you actually see.** The list was filed
  under one name for the provider and looked up under another, so the app
  decided there was no curation and showed the first few hardcoded entries
  instead. Refreshing against 118 live models changed nothing on screen.
- **An empty "Allowed tools" field means every tool, not none.** Leaving the box
  blank on a custom agent saved an empty list, and an empty list is a complete
  answer: this agent may use nothing. So the one thing you do when you don't
  know the tool names gave the agent no tools at all, and it failed by politely
  explaining it had no capabilities. Blank now means what a person means by it.
  The field also stopped requiring you to know the answer in advance: it filters
  all 184 tools by name and description, shows what you picked as chips, and
  says so when a name matches nothing.
- **An isolated agent cannot reach the two tools that were a shell in disguise.**
  Running commands is denied to an isolated agent on purpose. Two other tools
  each took an optional command and passed it straight through without a list of
  what is allowed, which made either of them a full shell by another name. They
  are denied now and gone from that agent's catalogue. No isolated agent could
  reach them in practice, because both need a bound code folder - an accident of
  plumbing rather than a decision, and it would have stopped being true the
  moment one got a folder.
- **Video rendering works on Linux.** Every Linux build shipped a copy of the
  video encoder built for macOS, and it was the first one the app found, so
  rendering a Studio video or a Flow motion died at the moment it started the
  encoder. The app now refuses a binary that cannot run on the machine it is
  on - on any platform, not just macOS - and looks in the place the correct
  Linux build actually ships, falling back to one installed on the system and,
  failing that, saying plainly that it found none.

## v12.5.5 - Nothing You Made Is Gone

A turn used to be a one-way door. Regenerating an answer deleted the one you
had; a Flow turn rewrote the deck you liked and the previous version was gone
from the disk. Both keep their history now, and both let you walk back into it.
Around that: Stop actually stops, an uncapped task runs uncapped, an isolated
agent stops writing into your memory, and GLM and Qwen become providers you can
simply pick.

### Added

- **A crash screen now tells you what crashed.** When a page stopped drawing,
  all you got was a line like "Minified React error #482" and a link to look it
  up. The detail that actually identifies the fault was being collected and
  written straight to the browser console, which is no help at all on the phone
  where these crashes tend to happen. Both crash screens now show that detail on
  the page: a ready-made report with the error, the page, and where in the app
  it broke, in a box you can select, plus a copy button. If copying is blocked -
  which it is on a plain connection to your desktop - the button says to select
  the text instead of pretending it worked.
- **Flow projects can be put away or thrown out.** The project grid only ever
  grew: a run that went the wrong way, a project started by accident and a
  throwaway test all stayed in it for good, because nothing in Flow could remove
  one. Each card now has two actions. Archiving is reversible and changes
  nothing else - the project keeps its files, its versions and its chat, and
  only leaves the grid, with a switch in the toolbar to look through what you
  put away. Deleting is the one that removes work, so it does not simply erase:
  the project folder moves to a trash folder next to your projects and can be
  recovered by hand. What deleting really ends is the conversation, and the
  confirmation says so instead of asking whether you are sure.
- **Motion can be made in a technique, not just in a palette.** Asking for
  papercut, pixel art or particles used to get you a normal animation with those
  words in the copy: the composition could only move boxes and text around, so
  that is what came back. Motion now has a Style setting of its own next to the
  model and the template, with fourteen techniques - papercut, pixel, particles,
  whiteboard, kinetic type, motion graphics, sketch, ASCII, isometric,
  blueprint, neon, comic, origami and silhouette - and three effects that stack
  on any of them: stop motion, glitch and film grain. Each technique brings the
  drawing it needs rather than imitating it, so pixel art is really drawn on a
  pixel grid and particles really are a particle system. It is a separate choice
  from a style pack, which decides the colours and the type: pick both and you
  get your palette, made that way.
- **A rendered video is checked before you are told it is ready.** Flow could
  already look over a finished design, but for Motion it looked at the
  composition, never at the video that came out of it. So the faults that only
  exist in the file went out unseen: a clip that freezes on one frame halfway
  through, a stretch that comes out black, a video that never moves at all
  because the animation runs on the clock instead of on the frame being drawn.
  Every finished render is now read back frame by frame, and anything found goes
  straight back into the project as a correction, with the exact seconds it
  happens at. The checks that need no vision model run on every machine; where a
  vision model is set up, the frames that actually differ from one another are
  looked at as well, so a broken transition or clipped text is caught in the
  file rather than in the preview.
- **A Flow project keeps every version of its artifact.** Each turn's result is
  archived before the next one can overwrite it, up to the last twelve, and the
  history opens from the preview toolbar as real renders of each version rather
  than a list of dates. From a version you can go back to it, download it as a
  ZIP without disturbing what you have now, or branch it into a project of its
  own and try the other direction. Coming back is not a one-way door either: the
  state a rollback replaces is kept as a version too, and the chat is told what
  happened so the next turn works from the files that are actually there.
- **Flow can just do what you said.** Every mode hands the run a starting file,
  a catalogue of layouts and a checklist. That is what makes a one-line brief
  come out finished, and it is in the way when you already know exactly what you
  want. A "Free" switch next to the brief turns all of it off: your brief is the
  whole specification, and nothing else is added. What you chose yourself stays
  on - your files, your template, your Brand Kit, your style pack. Motion keeps
  its starting file, because that one is the format the video is rendered from,
  not a suggestion.
- **A video can be as long as you asked for.** The length was a row of fixed
  buttons, one of them always picked, and that pick beat anything the brief
  said - so asking for 45 seconds quietly got you 5. "Follow instructions" is
  now one of the choices, and with it the length comes from your brief alone.
- **A Flow project can be handed to someone else.** Every export so far turns
  the artifact into something else and loses whatever that format cannot carry.
  The export menu now also offers the project itself: every file as it stands,
  in one ZIP, in any mode. It downloads rather than landing in the project, and
  it carries your work and nothing else - not the version history, not the
  backups, not the deployment settings, and none of the app's own bookkeeping.
- **Auto: the brief picks the output type.** A pitch deck for a coffee brand
  already says deck, and already says which structure, so translating that into
  a chip and a template before you have described anything is the same work
  twice. The Auto chip reads the brief and picks both, shows what it chose so
  you can correct it, and starts the run normally from there. If the helper
  model is unavailable it falls back to a keyword guess rather than to a Start
  that does nothing.
- **Ask first: a few questions before anything is built.** Flow could already
  ask mid-run; this asks while it still costs nothing, as a card of clickable
  choices, and folds your answers into the brief instead of turning them into a
  second turn. Anything you leave on "decide for me" is left out entirely, and a
  brief that is already specific gets no questions at all.
- **Undo and redo in the Flow editor.** The file editor is a plain text box, so
  the only undo it had was the browser's, which breaks the moment the text is
  set by anything but a keystroke. It has its own now, reachable from the
  toolbar and from the usual shortcuts: typing groups into words rather than
  characters, a line break always ends a step, and the cursor comes back to
  where the edit was instead of jumping to the end of the file. Taking a version
  the app put there over yours is undoable too.
- **Asking again keeps the answer you already had.** Regenerate an answer, or
  reword the question, and the previous turn is kept as a version instead of
  being deleted. Arrows and a counter at the answer step through them; switching
  restores the whole turn it belonged to, including its tool results, and
  survives a reload.
- **A deck leaves Flow as PowerPoint, a document as Word, a course as SCORM.**
  All three had exactly one way out until now: PDF. PowerPoint is built from the
  laid-out slides, so the text boxes are real ones the client can retype, with
  the pictures, the speaker notes and the slide colours; an artifact with nothing
  extractable in it exports as exact slide images instead, and says so. Word
  keeps headings, lists, tables and pictures editable. A course packages the
  project for Moodle and other LMS, with a runtime that reports the lesson
  complete inside the LMS and does nothing at all outside it, so the same file
  still previews here.
- **GLM and Qwen are providers you can pick.** DeepSeek was the only
  China-frontier provider you could just choose; these two were reachable through
  nothing but OpenRouter or a custom endpoint you had to wire yourself. Both are
  registered the whole way through: the provider card and its model list, the
  context and output limits, the live model refresh, the group-chat and
  custom-skill pickers, onboarding, and what Skales says about itself.
  Descriptions in all twelve languages.
- **Gemini 3.6 Flash and Flash Lite** are in the model lists, and are the
  default.
- **GitHub as an MCP server without Node.** It can now be added over its official
  remote endpoint with a sign-in, so it needs no npx and no access token at all.
  The local server stays, and both entries say which is which.
- **You hear about it when an agent schedules itself.** An isolated agent can
  give itself standing work that from then on wakes on its own, unattended. The
  only way to find out was to open the Schedule page. It is a notification type
  of its own now, so it reaches WhatsApp, Telegram and the phone with your quiet
  hours and channel choices applied, and it can be switched off like any other.
  You scheduling something in your own chat is not news to you, so that stays
  silent.
- **An isolated agent gets a memory of its own.** Each agent now has its own
  store, and its lessons go to its own file. Normal chat, custom agents and
  scheduled runs keep the owner's memory unchanged.
- **Look at an image by URL.** Image analysis takes an http(s) address now,
  instead of the download-then-look detour that put every picture the agent only
  wanted to see on the disk.
- **The no-time-limit setting is reachable.** A checkbox next to the slider, and
  the message at the end says what actually stopped the run.

### Added
- **Right-click a chat message for what you can do with it.** Chat bubbles had
  a small row of buttons that only showed on hover; a right-click did nothing.
  Now it opens a menu: Copy, Quote in reply (drops the text into the composer as
  a quote, ready to answer), Save to document, Read aloud, New session from
  here, Delete - plus Regenerate on an answer and Edit and resend on your own
  message. Deleting asks once before it happens, and right-clicking a passage
  you have selected leaves your normal copy alone. The menu it uses is one
  shared component, so the same behaviour is coming to the other lists.
- **Right-click a chat in your history for everything you can do with it.** The
  same menu now opens on a saved chat, in the History page and in the session
  list in the chat header. It offers Open, Pin, Rename, Archive, Download and
  Delete. The header list used to offer only a delete button on hover; now it
  has the full set, renames a chat in place, and deleting takes two clicks
  instead of a dialog. In all twelve languages.
- **Right-click a task or a schedule for its actions.** A task card now opens a
  menu with what fits its state - Run while it is waiting, Stop while it runs,
  Copy the title, Copy the result once it is done, and Delete. A schedule row
  opens Run Now, View Logs, Copy, Edit, Pause or Activate, and Delete. Both use
  the same menu as the rest of the app, delete takes two clicks instead of a
  dialog, and a system entry keeps only the actions it is allowed. In all twelve
  languages.
- **The image menu now works when you open Skales in a browser too.** Right-
  clicking a generated image, a Flow image or an image in a preview used to give
  the app's menu only in the desktop window; from the phone companion or a
  browser tab you got the browser's plain menu with no "Open in Studio". Now the
  same Save image, Copy image and Open in Studio menu appears in a browser as
  well, including for images inside a live preview. In all twelve languages.
- **Right-click an image or a link and get the menu you expect.** Images and
  links had no menu of their own anywhere in the app - not in chat, not in Flow,
  not in a preview, not in the built-in browser. Right-clicking an image now
  offers Save Image As, Copy Image and Open in Studio (which drops it straight
  into the image generator as a reference); right-clicking a link offers Copy
  Link and Open in Browser. Saving keeps the original file when it can, so a
  JPEG stays a JPEG, and falls back to a copy of what is on screen when it
  cannot, telling you by the name it suggests. It works the same in every window
  and in the in-app browser, in all twelve languages.
- **Right-click a link in a chat answer for more than copy.** A link in a
  reply now opens a menu with Copy link, Open in browser, Open in the built-in
  Browser, and Summarize - which starts a fresh chat that fetches the page and
  sums it up for you. The full menu shows in the desktop app and just as well
  when you open Skales from your phone or the web, in all twelve languages.
- **Right-click an API key field for what you want to do with it.** A key or
  secret in Settings stays a row of dots, and the only way to remove one was a
  small icon that appeared inside the field. Right-clicking a key field now
  offers Copy value - the real key goes to the clipboard while the field stays
  masked - Reveal or Hide, and Remove, which asks once before it clears. It
  works on every key in Settings, from the provider keys to the image, video and
  search service keys, in the desktop app and over the web, in all twelve
  languages.

### Fixed
- **A stuck reasoning model gets the bigger reply budget when a bigger one
  exists.** When a model spends its whole reply budget thinking and produces
  nothing, Skales retries it with more room. That retry was only offered when the
  turn had been running at the model's own limit, so a turn that had been capped
  lower - a background run, a Playground call with a set limit - was denied the
  extra room and re-ran on the same starving budget, then gave up. The retry now
  measures against what the turn actually used, so it gets the larger budget
  whenever there is one to give.
- **Things that are supposed to exist once now exist once.** Inside the app, a
  page you open and an action you trigger were each running their own copy of
  the same machinery, and the parts that only work as a single copy quietly
  came in pairs. The effects were spread across the app and all had the same
  root: the autopilot's hourly call limit could be counted twice, so it allowed
  roughly double the number of calls you set, and raising the limit in Settings
  only reached one of the two counters; switching autopilot off could leave a
  second heartbeat still ticking; a connected tool server could be started
  twice and stopping it left one running; the browser Skales controls could be
  reported as closed while it was open; the desktop could announce itself twice
  on the local network; a log file could be rotated by both copies at once and
  lose the lines the other had just written; a calendar settings change only
  took effect on one side; and two files being saved in the same instant could
  share one temporary name, which is a way to lose what was just written. All of
  it now lives in one place per app, as it was always meant to.
- **A project's deploy password stopped travelling with the project.** The
  settings a project keeps for publishing to your own server - host, user and
  password - are stored in a file inside the project folder. That file was left
  out of the project download, and nowhere else: it was listed among your
  project files where it could be opened and edited, it came back over the
  preview address to anyone who could reach your desktop, every saved version
  kept a copy of it, and it went out again inside a course package and a version
  download you hand to someone else. Publishing even uploaded it to the very
  server it describes. Now one list decides everywhere, and the files Skales
  keeps for itself - the project record, the deploy settings, the saved versions
  and the caches - stay out of every list, every download and every page you can
  open. Your work is untouched, and so are the versions you already have: they
  simply stop carrying the password with them.
- **Turning the effort dial down actually turns it down.** On a model without
  its own reasoning setting, picking Low or Medium for a chat still sent the
  full deep-reasoning instructions whenever the global toggle was on, so the
  answer was as slow and as expensive as before. The dial is the newer, more
  specific instruction and now decides: High and Extra high add the deep pass,
  Low and Medium leave it out. With the dial untouched, nothing changes.
- **A third of every request stopped being sent twice.** The instructions that
  frame a turn (the Flow brief, Code mode, a goal's plan, the live working
  state) were being placed at the top of the request AND appended at the
  bottom, so the model read the same pages twice and you paid for both. On a
  measured Flow deck turn the request fell from 86.3 KB to 56.6 KB, a third
  less, on that turn and every one after it. Nothing was removed: the second
  copy was the only thing dropped.
- **Your own instructions to Skales apply again.** The duplicate had taken the
  place where the personality and the system prompt you write in Settings
  belong, so on any turn that carried a frame, which is every Flow turn, every
  Code turn, and every step of a chat after the first, Skales ran without them.
  They are back where they belong, in front of everything else.
- **A picture sent over WhatsApp is answered, even when the picture does not
  arrive.** WhatsApp hands a photo over in two steps, and the reply was being
  written before the second one finished, so on a slower computer the file was
  never there. Sent on its own, the message vanished without a word; sent with a
  caption, only the caption came through and nothing said a picture had been
  missed. The file is now waited for and asked for again a few times, and if it
  truly does not arrive you get an answer saying so instead of silence, with the
  reason in the WhatsApp log. The same goes for anything this channel does not
  read yet, like a video: it is named rather than quietly ignored. Telegram had
  the same quiet corner and now says it too.
- **A note about an image no longer disappears behind its caption.** When the
  picture arrived but could not be read (no vision provider, a provider error,
  or image reading switched off for WhatsApp), the explanation replaced your
  message instead of joining it, so a photo with a caption looked like an
  ordinary text message and the reply never mentioned the picture. Both are kept
  now.
- **WhatsApp keeps working after an app update.** The record of which WhatsApp
  Web build your session runs against was stored next to the app itself, where
  macOS does not allow writing at all and where a Windows update deletes it. It
  now lives with your data, and an existing one is carried over, so a connection
  that works today keeps working after the next update.
- **A slide is centred on any screen, not only on a 1920x1080 one.** A deck is
  laid out at a fixed size and scaled down to whatever window it is shown in,
  but the scaled slide was being pushed towards the bottom right instead of
  sitting in the middle, so part of every slide was cut off in the preview and
  in any window smaller than full HD. It is anchored to the centre now, at any
  size. Exports were never affected and are unchanged.
- **The media settings you picked are actually used.** Aspect ratio, quality and
  a preferred model reached the model only as a sentence asking it to honour
  them, so a project set to 9:16 kept coming back square with nothing saying the
  setting had been dropped. They are now written into the generation call
  itself, and they win over what the model typed. Only values the tool can
  actually take are written: the rest is named in the result, so the reply says
  the picture is 4K only when it is. A model you name mid-project still wins over
  the preference you set on the landing.
- **A message can no longer be lost when two parts of the app write the same
  chat at once.** The lock that serializes chat writes lived per copy of a
  module, and the app loads that module more than once, so two writers could
  each hold their own lock, write the same temporary file, and leave the loser
  with nothing to rename and its messages gone. Seen live: a tool result
  vanished from a Flow turn, leaving the model to answer about work it could no
  longer see. The lock is now shared, and each write uses a temporary file of its
  own, so even a writer the lock cannot reach costs at worst an overwrite instead
  of a lost message.
- **A turn no longer loses the file you have open in the editor.** Nothing
  re-read that file after a turn wrote it, so the editor kept showing the
  version from before and the next Save quietly put it back over the new work.
  The editor now follows the file: with nothing unsaved it simply shows the new
  content, and with unsaved changes it says the file was rewritten and lets you
  keep yours or take the new one, instead of one of the two disappearing.
- **Leaving a file in the editor and coming back keeps your unsaved changes.**
  Switching to the preview and opening the file again re-read it from disk and
  threw the edits away without a word.
- **The version history is reachable while you are editing a file.** The editor
  takes the place of the preview, and with it the only way into the history.
- **Present a deck, not just show it.** A deck opens in a Presenter view of its
  own now: the current slide, the one coming next, the speaker notes for what
  you are on, an elapsed timer and the clock. The audience gets its own window
  with nothing but the deck, and the two move together, from the buttons or the
  arrow keys. Decks are also written with speaker notes from now on - what you
  say over a slide, not a repeat of what is on it - and those same notes travel
  into PowerPoint and into a new PDF handout that puts each slide next to its
  notes. A deck that has no notes says so instead of handing you empty pages.
- **Build a Brand Kit from a website.** Paste an address into the Brand Kit
  settings or into the New kit dialog in Flow, and the kit fills itself from the
  page: the palette, the heading and body typefaces, the logo, the name, the
  tagline and a short description, with the site kept as a reference link.
  Colors and fonts are read out of the page and its stylesheets, so what lands
  in the kit is what the site actually uses, not a close-looking guess - the
  page says which color is its surface and which is its body text, and the roles
  follow that rather than whichever color happens to appear most. Nothing is
  saved by reading a site: the fields are filled and you still press save, so a
  bad read costs a glance.
- **Using the logo can be decided mid-project.** Which Brand Kit a Flow project
  designs with switches from the toolbar at any time, but the "use logo and
  brand assets" half of that same choice could only be answered on the landing,
  before the project existed. A project started without the logo could never be
  given it, and one that was meant to stop demanding a logo file had to be
  started over. The toggle now sits under the kit in the toolbar menu, applies
  from the next turn, and stays where you left it when you switch kits or turn
  the kit off and on again.
- **The wireframe and phone modes are reviewed as themselves.** Both start from
  the same file as the web prototype, and were reviewing themselves against its
  checklist too. So a phone mockup was told to make sure its layout collapses to
  one column on a narrow window, which means nothing for a strip of fixed phone
  screens and invites the run to break the strip, and neither mode was ever
  asked whether it had done the one thing that mode exists for. Each has its own
  review now: the phone mode confirms it built phone screens rather than a
  website, with buttons in thumb reach and the labels the product would ship;
  the wireframe confirms it stayed grey, kept its image boxes crossed out and
  annotated, and used the real navigation. Both also say where a picture comes
  from, which neither did before: the phone mode may find and place real images
  like every other mode, and the wireframe deliberately fetches nothing and
  keeps labelled boxes, instead of each run deciding that for itself.

- **Stop now ends the session.** Stop reported success whether or not it stopped
  anything, so with a stale run the panel said stopped while the run kept
  generating, and reopening found it still live. A stop now answers honestly and
  sweeps the session: the run you are looking at first, then every other live run
  on it. Chat does the same sweep.
- **A stopped run stops looking like a failed provider.** The fallback chain read
  a stop as a dead provider: it walked the rest of the chain and put the primary
  on cooldown, so pressing Stop quietly moved the next turn to another provider
  and the run ended in "all providers failed". A stopped run now ends the chain
  and says it was stopped.
- **No time limit now means no time limit.** The task timeout has documented 0 as
  run-to-completion for a while, but the code took the zero literally: the
  deadline fired on the next tick and the task died before its first step. An
  uncapped run is now judged on whether it is still doing something, and ends
  only after fifteen quiet minutes.
- **A resumed workday remembers what it already tried.** The task loop had no
  repeat guard, so a stuck model reissued the same call with the same arguments
  until the clock ran out, and the checkpoint carried that stuck state into the
  next resume while every counter restarted at zero. The guard now rides along in
  the checkpoint, so "already tried" means across the whole chain. A chain that
  adds nothing new ends itself; one that is actually advancing resumes for as
  long as it advances.
- **A chain of runs stops saying it is done seven times.** Each round announced
  itself as finished. A run that queued its own continuation now holds its
  notification and its report until the chain really ends.
- **Continuing a task by hand keeps the agent it belongs to.** Typing "continue
  the task" carried the work on in your chat as the default agent, no matter
  which agent the task was bound to, with that agent's identity and data replaced
  by yours. It is now queued as a continuation under that agent, and the chat
  says so. An unbound task continues in chat exactly as before.
- **Saving a chat stops blocking on every message.** Each message read the whole
  session file back, stringified it and wrote it, all synchronously, on paths
  that are mostly remote-facing. Creating a session also wrote its own file
  outside the shared writer, so a new chat skipped the auto title, the base64
  stripping and the message cap.
- **Skales asks its questions again.** It could ask you a question through a form
  card since v11.3, and mostly did not: only one way of writing the call was
  accepted, so a model that phrased it slightly differently produced nothing, and
  a failed tool goes to the model, not to you. It retried until the turn ran out
  and the session ended empty. All those shapes are read now, and a question that
  still cannot be shown says so on screen instead of vanishing.
- **Test Connection tests what you typed.** It only ever tested the saved
  provider, so pasting a key and pressing Test failed while the long way round
  worked.
- **Fetch models and the key remove button exist on every provider card.** Both
  were built into a block only five providers render, so Fetch existed on
  OpenRouter and nowhere else. The remove button also moved into the key field as
  an icon, so the card stops jumping when a key is saved.
- **MCP servers can find the tools you installed.** A double-clicked app is
  started without a login shell, so nothing installed with Homebrew, nvm, fnm or
  into a local bin folder was visible, and every npx-based MCP server died with
  "spawn npx ENOENT" while the same command worked in Terminal. The usual install
  locations are now on the path a server is started with, anything you set
  yourself still wins, and a command that cannot be found is reported by name
  with the two ways out.
- **A skill loads when you name it, not when a word contains its name.** A skill
  was pulled in on a substring, so one called "teach" matched "can you teach me
  about anything at all" and pushed ten kilobytes of unrelated instructions into
  the prompt. Naming a skill still loads it, including the slash form; a name
  buried inside another word does not.
- **A stranger cannot stop your turn in a Telegram group.** Everyone writes to
  the same chat, and the stop machinery only knew the chat: someone else typing
  "stop" killed your running turn, and someone else's chatter counted toward the
  follow-up threshold. Both now follow the sender. One-to-one chats and WhatsApp
  were never affected.
- **Importing a skill brings its files.** The GitHub import asked whether a skill
  had scripts and references, recorded the answer, and then downloaded neither,
  so a skill claimed to ship with its scripts while any instruction pointing at
  its own files failed. Both folders are fetched now, and the flags describe what
  actually landed on disk.
- **Long-term memory asks where a fact came from.** Memory harvesting mined
  assistant turns without asking about origin, so a summary of a stranger's email
  or a fetched page was a candidate like any other, and a sentence planted inside
  that content could walk into memory through the summary. A turn that pulled in
  content written outside the conversation is no longer mined. Your own files,
  your own machine and your own messages are unaffected. The cost is real and
  stated: a fact you mention while discussing fetched research in that same turn
  is lost with it.
- **An error from a phone-initiated turn opens the right conversation.** It
  carried no session, so tapping the notification opened the chat landing instead
  of the conversation it belonged to.
- **A finished answer is not argued with.** Any sentence anywhere that looked
  like an announced next step re-prompted a completed answer up to three times,
  including recaps of work already done and offers handed back to you. The check
  now reads the closing stretch of the answer and no longer mistakes an offer for
  a promise.
- **The activity log stops losing lines.** Its rotation state was kept per copy of
  a module rather than shared, so two parts of the app could rotate at once and
  the loser's lines were lost.
- **A scheduled job keeps its shape and its agent.** The cron API wrote its own
  envelope into the job file, so an update persisted the word "update" as a
  field. A job can also be bound to an agent when it is created, rather than
  needing a second call, and a run started over the API is filed as the manual
  run it is.
- **Good files stop being called broken.** The download validator was rejecting
  real files: a favicon served as PNG bytes, a one-pixel GIF under the size
  floor, an SVG with a licence comment in front of it, a ZIP with a stub before
  its first entry, and a QuickTime file that opens on a different box. The
  bot-wall case it was built for is still caught.
- **Reveal in the file manager stays a reveal, not a launch.** The action that
  shows a folder or file in Finder or Explorer handed the path to the system
  opener as-is, and the opener treats some paths as "run me" rather than "show
  me": an app bundle, a script, a desktop launcher would start instead of being
  revealed. A file is now handed to the opener in reveal mode, so it is always
  shown in the file manager and its own handler is never invoked; a folder still
  opens as before. The same endpoint also turned away a request coming from
  another site in your browser - a page you happen to be visiting could reach
  the local app and ask it to open something. It now accepts the request only
  from Skales itself.
- **Uploading a skill no longer runs it.** To show a skill's name and
  description in the list, the app used to execute the uploaded file, with full
  access to the machine, the moment it arrived - before you had looked at it,
  and whether or not you ever pressed anything. A file that did its damage and
  then failed was simply filed as broken, so there was nothing to notice. Those
  few lines of information are now read out of the file as text, without running
  any of it, and every skill in an uploaded archive is treated the same way. A
  skill runs when you run it, and not before. Uploading also stopped accepting
  requests from other sites in your browser.

## v12.5.4 - Pictures and Providers

Sending a picture is a normal chat turn now. It was not: it ran on a path of its own, outside everything the app does to keep an answer alive, and the previous release patched that path instead of removing it. The path is gone, and the same class of loss is fixed everywhere else it hid - in Buddy, in the AI Pointer overlay, and in the model recognition that quietly shrank a new model's context window to an eighth of its real size. Moving that turn onto the normal path also broke a promise nobody could see from the outside: an incognito chat with a picture in it was being written to disk. An incognito chat now runs on a conversation that has no file at all. Moonshot AI (Kimi) joins as a provider.

### Fixed

- **Incognito keeps its promise on picture turns.** Since image turns became normal chat turns, the answer to a picture was written to the chat file by the part of the app that generates it - which never knew about incognito. An incognito chat with a picture in it was saved, and saved half-blind: your own message suppressed, the reply kept. An incognito chat now runs on a conversation that exists only in memory: nothing about it is written anywhere, not the messages, not the live reply, not an entry in History, and it is gone when you leave incognito or close the app.
- **The app's own nudges stop being mistaken for your instructions.** When a turn needs a correction, the app writes one into the conversation the same way you would, because that is the only way it reaches the model. Everything that then looked back for "what did the user ask?" found the correction instead: a parked task could adopt a nudge as its objective, and it could be written into memory as something you had said. A checklist created during such a turn also went invisible, so a task that had a plan stopped continuing on its own. The corrections still reach the model, unchanged; they are no longer read back as yours.
- **Stop reaches an image turn during the handoff too.** Stopping while the picture was being prepared cleared the screen, and the turn then started anyway a moment later: the answer arrived after you had stopped it. It now ends the run it just started.
- **Buddy still sees the screenshot after you approve an action.** Approving a tool continues the same turn in a second request, and that continuation went back to the stored conversation - where the picture is a placeholder by design. The stored picture is read back for the continuation, so the rest of the turn is answered about the screenshot too.
- **A picture no longer pushes the conversation out of the request.** An attached screenshot was sent at full resolution - several megabytes - and the app measured that literally when deciding how much history still fit, so one picture could take the entire budget and the model answered it with no conversation behind it at all. Pictures are now sent at the size every provider scales them to anyway (the stored copy stays full resolution), and they are counted for what they cost instead of by their raw size. Long chats with images also got noticeably faster.
- **Moonshot's region switch works everywhere it should.** Refreshing the model list ignored the picked region and asked the international host with a China key (two separate accounts - the key is invalid there), so Refresh reported no models on a correctly set up provider. The selected region also did not look selected, because it was painted with colours that only exist in the AI Pointer window. Both fixed, and a stored address in a slightly different but equivalent form is now recognised as its region.
- **Buddy sees the screenshot you attach.** Attaching a picture in Buddy showed it in Buddy's own bubble and then answered past it, because the image never reached the model. Session files deliberately do not store raw image data, and Buddy read its history back from that stored copy - so what arrived at the model was the placeholder the storage layer had left behind. Opening the chat afterwards showed that same placeholder as a broken image. The picture is now stored as a file the chat can render, and the live one is handed to Buddy directly, routed to a model that can actually see.
- **Pictures from Buddy and the AI Pointer show up in the chat.** Those turns store the picture as a file and no preview copy, and the chat bubble only ever looked for the preview - so opening the chat afterwards showed the message with no image at all. The stored picture is now shown directly.
- **A screenshot sent from the AI Pointer overlay to the chat keeps its picture.** The overlay sent the image along with the question, and the chat import ignored it, so the turn arrived as text with the picture missing.
- **New model generations work the day they land.** Model recognition was written as per-version lists, so each one broke the moment a vendor shipped the next number. A Gemini generation newer than the app ran through OpenRouter at an eighth of its context window and an eighth of its output limit, which made long chats compact themselves far too early and cut long answers short. Kimi's vision-capable generations were a literal two-entry list that the next release would not have matched. Both are rules now: a new Gemini or Kimi generation is sized and detected correctly without waiting for a Skales update.
- **Extra custom endpoints get their real context window.** Every endpoint added under Additional Custom Providers fell back to the smallest possible window rather than the one custom endpoints are meant to get, so a 128K model was run at half of it and conversations started compacting after a handful of turns. The single built-in custom slot was never affected.
- **The switches on a custom endpoint do something.** On endpoints added under Additional Custom Providers, turning tool calling off did nothing - the tools were sent anyway, and an endpoint that cannot call them answered with garbage. The Vision checkbox was worse: nothing in the app ever read it, on any custom endpoint, so images were stripped out before the request left regardless of what you ticked. Both are honoured now, and both still default to what they did before.
- **An image turn no longer reports itself dead while it is working.** The composer watches for a locked input with no live turn behind it and frees it after 25 seconds. An image turn never registered as a live turn, so on every picture you sent - since the release that added that guard - the app unlocked the composer and said the run had stopped responding, while your Vision Provider was in fact still reading. Reading one image with a local model takes longer than that on its own, several images take minutes. Image turns are real turns now, and the guard leaves them alone.
- **You can watch an image answer arrive.** The reply now streams token by token like any other, instead of showing a spinner until the whole answer is finished. On a long answer from a local model that is the difference between a working turn and a turn that looks frozen.
- **Stop stops an image turn.** The button could not reach the call that was running; it cleared the screen while the work continued in the background and the answer landed afterwards anyway. It now ends the actual turn.
- **Your custom agent answers your images.** With an agent selected, an image turn used its model but not its instructions, so the picture was answered by the default assistant wearing the agent's name. The agent's own prompt and its assigned skills now apply to an image turn. A picture handed straight to the chat model is still answered without tools, so that the model reads the image instead of reaching for something else; with a Vision Provider set up, the turn keeps the full toolset.
- **A reply cut off mid-sentence finishes itself.** When a model hit its output limit, the answer simply stopped where it stopped. The rest is now requested and joined onto what came before, so one complete message lands. This applies to every chat turn, and to the ones nobody is watching: a task, a Flow run or a scheduled run used to accept a half sentence as its finished result and close on it.
- **A picture that could not be answered says so, permanently.** If starting the answer failed outright, the error showed once and was gone: after a reload the picture sat there with no reply at all, and the model later saw a conversation ending on an unanswered question. The failure is now part of the conversation. The helpful guides for the two most common causes - the Ollama vision model is not installed, or the Vision Provider has no key - are also back, in all twelve languages; they had been lost in the rebuild and every cause showed the same generic text.
- **Telegram and WhatsApp answers carry the same protection as the desktop chat.** The way those two channels handed their instructions to the model switched off the assembly step that, among other things, tells the model to treat fetched web pages, files and messages as data rather than as instructions. Both channels now go through the same assembly as everything else, and material coming back from tools is marked as untrusted content there too.
- **A reply cut off mid-sentence finishes itself on every channel.** The repair that stitches a truncated answer back together existed only in the desktop chat. On Telegram and WhatsApp a long reply simply ended mid-sentence; from the phone it was worse - the beginning of the answer was dropped and the message started mid-sentence. Buddy never checked at all. All four now request the missing remainder and deliver one complete message.
- **A model that thinks itself empty gets rescued on every channel.** When reasoning consumes the entire reply budget, the desktop chat raises the budget, then turns reasoning off, then says honestly what happened. Telegram, WhatsApp, Buddy and the phone either retried the identical doomed request or invented a cause: Buddy said a bare "No response.", the phone blamed your provider settings. All of them now climb the same ladder and, if it truly ends empty, tell you what actually happened - in your language.
- **A tool call torn by the reply limit no longer runs broken on Telegram and WhatsApp.** A file write cut off mid-content executed anyway with half its content or failed on unreadable arguments. Like the desktop chat, both channels now hold the torn call back and ask the model to redo it in smaller pieces.
- **A picture sent from the phone reaches a model that can see.** An image turn from the phone ran on whatever model was active; if that model cannot process images they were quietly removed before the request went out, and the answer ignored the picture. The turn is now routed the same way a desktop image turn is: to a model that can actually look at it.
- **The recovery steps a stuck turn is supposed to take now actually happen.** When a model spends its whole budget on internal reasoning, repeats a failing tool call, or announces a step and then does nothing, the app sends it a correction and tries again. Those corrections were being dropped before they left the app, so the retry re-sent the identical request and the model repeated itself. They reach the model now. Instructions from your own hooks were dropped the same way and now arrive too.
- **An incognito chat stays incognito, and stops being lost.** Leaving the chat page and coming back reopened the incognito conversation as an ordinary chat: no purple marking, no "nothing is saved" notice, and because it kept running on a conversation that has no file, everything written in it from then on was saved nowhere and gone at the next start. Coming back to an off-record chat now finds it marked as one.
- **The picture in an incognito chat is not written to disk either.** Attaching an image saved the full-resolution original into the workspace uploads folder before the chat even existed, and nothing removed it afterwards, so it stayed readable by every file tool long after the conversation was gone. Off the record now covers the picture too.
- **The Buddy carries the same protection as everything else.** The way the Buddy handed its instructions to the model switched off the step that tells the model to treat fetched pages, files and messages as data rather than as instructions, and its tool results were not marked as untrusted. It is the assistant with the widest reach and the one that runs a step without asking, so it needed that protection most. It now goes through the same assembly as the desktop chat and the two messaging channels.
- **A cut-off answer no longer disappears when finishing it fails.** A reply that hit the output limit is continued and joined into one message, but if that second request failed or you pressed Stop while it was running, the half you had already watched arrive was thrown away and only an error remained. What was produced is kept now, whichever way the turn ends.
- **A picture is no longer sent to a model that cannot see it.** On providers where the app cannot swap in a seeing model by itself, an image turn from your phone or from the Buddy went out to whatever model was active, and a text-only model answered with the provider's raw rejection. The turn now says plainly that the model cannot read images, and how to set up one that can.
- **Kimi's own default model reads pictures again.** Recognition was written around version numbers, and the rolling model name Skales itself ships as the Moonshot default carries no version number, so the app treated its own default as unable to see: through OpenRouter it quietly moved the picture to a different vendor's model, and on Moonshot it reported the model as blind. That name and the 2.5 generation are recognised now.
- **Gemini's image models get their real context window.** They were sized by the family rule at a million tokens, thirty times their actual window, so the conversation was never compacted, the context meter read far too low, and the request failed once the chat passed the real limit. They now carry their own sizes, and a picture-model released later is sized cautiously instead of far too large.
- **"Test connection" honours the Moonshot region.** The button always tested against the international host, so a correctly set up China account reported an invalid key, and a passing test saved a configuration still pointing at the other service. The region you picked is now used for the test and stored with it.

### Added

- **Moonshot AI (Kimi) is a provider you can just pick.** Paste a key, choose International or China, and it works the way every other provider works: in chat, in Lio AI, in Codework, in Flow, in group chats, in custom skills, in the onboarding, and in the model picker everywhere models are chosen. The two Moonshot services are separate accounts with separate keys, so the region is a switch rather than something to type. Kimi's context window, its tool-call handling and its tuning profile were already in the app; what was missing was the provider itself.

## v12.5.3 - Flow Hotfix

The 12.5.2 reasoning watchdog cut healthy long-thinking runs: models that built a motion graphic fine one day earlier spent half an hour in cut-and-retry ladders the next. The guard is now behavioural, the stall card actually does what it offers, custom widgets are usable again in every theme, and custom agents see your connected MCP servers again.

### Fixed

- **A custom agent sees your MCP servers again.** The chat agents you build yourself run on their own prompt, which left out everything about the environment they work in: the connected MCP servers were never mentioned to them, and the tools were waiting behind a load step the agent was never told about. Asked about a connected server, such an agent answered that none were set up. Custom agents now get the same truthful MCP status as the default assistant - which servers are connected, and the exact step to pull their tools in - plus the index of every other tool group they can load.
- **An image with text gets a real answer.** Sending a picture along with a question could end in a silently empty reply: a reasoning model that spent the whole turn thinking produced no visible text, and the image turn had none of the safeguards normal chat turns have, so nothing appeared and no error was shown. In older versions the same gap showed up as a reply cut off mid-sentence. An image turn now retries once asking for the answer directly, stitches a cut-off reply back together with one continuation, and when a model truly never answers it says so honestly instead of staying silent.
- **New vision models are recognized without waiting for an update.** Skales asks your Ollama daemon what each model can actually do instead of matching names against a built-in list, so a model that just came out is treated as vision-capable the moment it appears. Kimi K2.6 and K2.7 stop being flagged as text-only, and the name list stays only as a fallback for older daemons.
- **The image-description row fits its content.** The collapsed "Vision" row under an attached image stretched across the full bubble width, which next to a narrow image looked like a broken layout. It now hugs its label and only widens when opened.
- **Custom widgets scroll again.** A widget taller than the window could not be scrolled at all: it grew past its pane while the pane itself refused to scroll, so everything below the fold was simply unreachable. Clicking or typing also made the page slide down under the pointer, because the widget's own click handling was being mistaken for new content.
- **Custom widgets follow your theme.** They were painted in fixed dark colours, so on a light theme the text was unreadable. They now inherit the theme's own colours and switch along with it, without losing what you had entered.

- **Long-thinking models can think again.** The previous release stopped a reasoning stream once it crossed a fixed share of the reply budget, which killed exactly the deep runs it was meant to protect, and then retried the doomed step with the very same budget. The stream is now stopped only when the model is provably stuck repeating its own trace, or exceeds the physical context window; whether a budget is exhausted stays the provider's call. The pointless same-budget retry is gone, and the request no longer asks for a reasoning bound the failing models were measured to ignore.
- **The stall card's buttons work.** "Keep going" was re-raised by the next status poll within a second, and Stop had to win a race against that same poll, which could take a dozen clicks. Dismissing the card now sticks for the rest of the run, and Stop takes effect immediately while the server abort settles in the background.

- **Motion scenes no longer bleed through each other.** Scene transitions layer the incoming scene over the outgoing one, and a transparent scene showed both at once (old text under new text). Scenes are opaque by default now, and Flow renders frames from inside the transitions after every motion turn and checks them - plus a code-level check for exactly this class of conflict - firing a correction automatically when something is off.
- **Your model choice in Flow is the one that runs.** If a model was set under Settings > Chat & Code > Code model, it silently overrode the model picked in Flow: the project kept showing your choice while the run used another model, and switching models to escape a stalled run changed nothing. Flow's own pick now wins in Flow.
- **Options that promised something they did not do.** The reasoning-effort dial is hidden on models that have no such control instead of being offered and ignored. Switching mode clears a pinned image or video provider that does not exist in the new mode. A pinned skill that you switch off in settings stops riding along. Pinned-skill and style-pack chips show real names instead of raw slugs.
- **A short motion brief stays short.** Asking for 3 or 5 seconds used to arrive at the model alongside two other duration ranges from the built-in guidance, and the model spent the turn reconciling them. Your duration now overrides everything else and shapes the scene plan.
- **Image and video projects see your attachments.** Those modes skipped part of the briefing: an attached reference image was never mentioned to the model, and they had neither the fact-checking rules nor the scratchpad the other modes get.
- **Flow's option rows scroll instead of wrapping.** The mode chips, the composer options and the project toolbar stay on one line and slide sideways at every window size. Dropdown menus can no longer leave the window: they clamp to the frame, flip upward when there is no room below, and the reasoning-effort row in the model menus is always visible instead of hiding behind the model list's scroll.

### Added

- **Changing the model mid-run resumes the work.** Picking a different model while a run is working closes that run, moves the project to the new model and continues the work in place, without restating the brief. This is what the stall card's "Change model" now does, and the project's model menu behaves the same way.
- **PDF export for decks and documents.** Both modes have advertised it since Flow shipped without an actual export anywhere in the app. The preview bar now has it: a deck exports one full-bleed landscape page per slide, a document exports through its own print layout.
- **A scratchpad in every Flow project.** The agent keeps a small working-memory file - plan, decisions, open items - current while it works, and a panel in the project shows it live. It carries over into new chapters, so long projects keep their thread.

## v12.5.2 - Flow and Security

Flow gets real controls for long projects and long-thinking models, a security hole on the local command interface is closed, and the app finally reports its own version correctly.

### Fixed

- **A closed door that was standing open.** The local command interface accepted requests without a valid access token, so anything on the same network could reach it. It now requires the token, the way it always should have.
- **Reasoning models that thought forever now get stopped.** Some models spend their entire reply budget on internal reasoning and never write an answer. A live watchdog now ends a run that has clearly thought past its whole budget, instead of leaving you staring at a spinner for twenty minutes.
- **Flow's Stop button actually stops.** After a page reload it used to lose track of the run and only pretend to stop while the work kept going. Stop now reaches the real run every time, and reopening a project reconnects to it.
- **A crashing preview no longer takes the whole project down.** A render error is caught in place and recovers, instead of blanking the page and orphaning the run.
- **The app reports the right version.** System properties and the About box were frozen at an old number regardless of the installed release; they now match.
- **DevKit can be enabled on an installed app.** The developer command interface only worked from a source checkout; it now reads its config from the data directory (`~/.skales-data/devkit/`), so the CLI works on a normal install. Requires the matching DevKit CLI v0.3.0.

### Added

- **New chapter in Flow.** After many rounds of changes a project can continue in a fresh, lighter session that keeps the files and a short summary but drops the long transcript, so it stays fast and costs less. Offered on its own once a project gets heavy; your brand kit, template and model choices come along.
- **Change the model and reasoning effort mid-project.** Both were only settable when starting a project; now they sit in the project's model menu and apply from the next step.
- **A way out when a model stalls.** If a model finishes twice with nothing but reasoning and no answer, the panel offers to switch to a different model instead of leaving you stuck.
- **Option chips scroll on narrow screens.** The mode and parameter rows slide sideways instead of stacking into several lines.

## v12.5.1 - Hotfix

Connected MCP servers are visible to the AI again, background tasks stop running in circles, slow models get the time they need, and the Tasks page becomes something you can actually keep tidy.

### Fixed

- **The AI can see your connected MCP servers again.** Their tools are fetched on demand to keep messages lean, but the AI was being told they were already active, so it concluded it could only see the built-in tools. It now knows how to pull in each server's tools and does so on its own in chat, Flow and scheduled runs.
- **Slow models no longer lose a whole task partway through.** A single model reply was cut off after a fixed short limit, and because that counts as an error the task failed with no resume - painful for local and reasoning models that legitimately take longer to answer. The reply now has the full task time to finish.
- **Background and scheduled tasks now see the full results of their file reads and searches.** Until now they received only a bare count or metadata, so a task that needed to look something up could repeat the same search endlessly, burning through its time limit run after run without ever finishing. The same blind spot affected agent teams and the Buddy after a tool approval. All of them now see exactly what chat sees.
- **Deleting an old reminder on the Tasks page works now.** Rows that came from the Planner were silently ignored by the delete button, so one-time reminders could never be removed from the list.
- **Flow shows what the model is actually doing.** A reasoning model can think for minutes before the first visible word, and Flow showed only a bare "deciding" spinner the whole time. The status row now shows that the model is reasoning, a live glimpse of its train of thought, and the elapsed time. The Stop button remains available throughout.
- **An answer no longer comes back empty after a long reasoning phase.** Models with extended reasoning could spend the entire reply budget on thinking and finish with no visible answer. That case is now caught and retried once with a much larger reply budget and a nudge to answer directly.
- **Flow menus stay inside the frame.** The model and template dropdowns could open partly outside the visible area near a screen edge. On narrow screens they now open as a bottom sheet that is always fully visible.

### Added

- **The Tasks page can be searched, filtered and cleaned.** A search box, status filters with counts (All, Active, Done, Failed, Stopped), newest-first ordering, and a one-click "Clear finished" that removes every completed, failed and stopped task - running and pending ones always stay.

### Changed

- **The task time limit can now be set up to 60 minutes** in Settings, for long-running local models that need room to work.

## v12.5.0 - Skills

Skales learns skills: a built-in library it can reach for on its own, style packs that give Studio a committed aesthetic, ready-made agent teams - and an agent that keeps working instead of stopping halfway.

### Added

- **A built-in skill library, ready on install.** Skales now ships with a curated set of working skills - disciplined bug diagnosis, relentless plan interviews, research with cited sources, test-first coding, handoff documents and more. Skills marked automatic are picked up by the AI on its own when the task fits; the others run when you name them. Every skill shows its author and license right on the card, the library is searchable with category filters, built-ins cannot be deleted (only switched off), and any skill you import under the same name simply takes over.
- **Skills in chat, on demand.** Mention a skill with @ or just ask for it by name - the AI loads the full instructions itself before acting.
- **Style packs for Studio.** 74 aesthetic references - each clearly labelled as inspired by a well-known product or brand look - can be pinned to a Flow project. A pack shapes typography, color and layout mood; your brief always wins on content, and no real logos or trademarks are ever reproduced.
- **Flow knows its skills.** The Flow landing gets two new controls: pin up to three skills that ride along on every step of the project, and pick a style pack next to the Brand Kit. Your choices show as chips on the first message, so a project always tells you how it was set up.
- **Ready-made agent teams.** Organization offers five presets - Research, Build, Analysis, Content and Ops - each with sensibly prompted roles. One click creates the team; everything stays editable, and building a team from scratch works as before.
- **Images carry their origin.** A picture that really came from image generation wears a small origin badge - text that merely claims a picture does not. The generation prompt now sits in a collapsible "Show prompt" section under the image instead of flooding the chat.

### Changed

- **The agent finishes what it starts.** An answer that ends mid-plan is no longer the end of the turn: with open checklist items or an announced next step, Skales continues on its own instead of waiting for you to type "continue".
- **Scheduled work resumes itself.** A scheduled task that hits its time limit while still making progress now queues its own continuation and picks up from the checkpoint - overnight jobs no longer stall until someone pushes them.
- **One schedule, once.** Creating the same schedule twice is refused with a clear message instead of silently doubling future runs.
- **Downloads tell the truth.** A downloaded file is checked against what it claims to be - an error page pretending to be an image fails loudly instead of leaving a broken file behind, and re-fetch attempts identify the app honestly.
- **Websites that block the built-in browser now say so.** Instead of failing quietly, the run explains the block and points to the visible-browser login handoff.
- **Knowledge-graph import shows real progress** instead of sitting at zero for minutes.
- **Every provider key can be removed** - including the ones that previously had no remove button.
- **Long-term memory learns only from real conversations.** Automated feeds and error messages no longer qualify as facts about you.
- **Quitting means quitting.** The power buttons close the app and its background helpers for real instead of reloading the window.
- **A cancelled goal says so once.** The cancel notice appears exactly one time and no longer returns on every reload.

### Fixed

- Push notifications tapped on the phone open the exact conversation they belong to, even when the app was fully closed.
- Attached documents with embedded pictures no longer flood the conversation with image requests.
- Image messages no longer show stray formatting fragments beneath the picture.
- The Flow file panel closes properly, and long file writes no longer end with the whole page pasted into the chat.

## v12.4.5 - Checkpoint

The release that locks the doors before adding more rooms: remote access becomes one honest switch, pairing asks you first, videos work from the first message, and your phone can hand the desktop videos, PDFs and its whole photo batch.

### Added

- **Remote access is one switch, default off.** Off means the server listens only on this machine - in a hotel or cafe network the port simply is not there. On means reachable over LAN/Tailscale AND token-protected, as one inseparable setting; the in-between that used to be the default (reachable, no token) no longer exists. The access token now survives restarts, and Settings > Security shows it at the very top with a copy button, a QR code and a regenerate button. Swarm users are unaffected: an enabled Swarm keeps the port open for its peers.
- **Pairing asks you first.** A phone (or any device) that knocks with your pairing code no longer connects by itself: the Mobile page shows who is asking - device name plus the tail of its key - and you allow or refuse. Your Allow counts only for the device you were shown, refusing is "not now" rather than a ban, and unanswered requests expire on their own.
- **Pair without a camera.** The desktop now shows a copyable pairing string under its QR code - for remote onboarding, headless devices, or whenever scanning is impractical.
- **Video from the very first message.** The chat landing page accepts videos (picker and drag & drop) up to 100 MB, shows a thumbnail chip, and hands the analysis to the same frame-sampling flow the in-session composer uses.
- **Videos, PDFs and full photo batches from your phone.** The bridge speaks a new protocol: the paired app (2.4.5) streams videos and PDFs to the desktop in chunks, every attached image arrives instead of only the first, and the phone can display the desktop's knowledge graph. Older app versions keep working exactly as before.
- **Attach audio, and videos get their soundtrack read.** Drop an audio file into either composer and it is transcribed through your configured speech-to-text provider, then reads like any attached document - with an honest message if no provider is set up. Video analysis now also listens: the soundtrack is transcribed alongside the sampled frames, so "what is said in this clip" finally has an answer. Both are best-effort and never block the run.

### Changed

- **Server actions joined the token gate.** With remote access on, the token now guards the entire local surface - not only the /api routes but the internal action calls pages are built on. Verified against the packaged server: without a token, nothing executes and nothing is written.
- **Frames fold into an accordion.** A video message shows its sampled frames as a compact expandable strip under a thumbnail instead of ten full-size images, and the bubble reads like your question again instead of an attachment note.
- **The knowledge graph stays yours.** Machine-written sessions (briefings) and Skales' own product terms no longer enter the graph - the extractor filters them at every entry point, and Settings offers a one-time cleanup that removes previously collected ones without touching your real entities.

### Fixed

- **Friend Mode no longer double-texts.** Two overlapping schedulers could each generate their own check-in inside one cooldown window - two different messages in the same minute. One in-flight guard now spans both, including across the app's two server bundles.
- **The @ and / menus close when you click away** - and a slow, deliberate click on an entry no longer loses the selection.
- **Stop works while frames are being sampled.** The red stop button now aborts a video analysis during the "sampling video frames" phase instead of only after it.
- **The pairing QR told phones the wrong desktop version** - hardcoded at 10.1.0 since that release; it now always carries the real version.

## v12.4.0 - Piranha

Generated media shows up where you asked for it, your phone sees what the desktop is doing and can stop it, goals know when they are done, and every agent gets its own name, hooks and task list.

### Added

- **Your phone sees a running desktop chat - and can stop it.** When the paired app has a session open that Skales is working on, the phone shows a live banner with a Stop button, streams each tool step as it happens, and receives generated images right in the bubble. The desktop also gained a "send to phone" action that forwards a workspace file or note to the paired app, with a push if the app is closed. Work done from the phone now shows up as proper tool cards when you open that session on the PC.
- **User hooks.** Run your own text snippet or shell command at chat lifecycle points: session start, after a tool result (optionally one specific tool), or when a goal finishes. Command hooks go through the exact same safety gates as the model's own commands, and isolated agents never fire them.
- **Tick the task list yourself.** The checklist Skales keeps in a normal chat is now clickable when the chat is idle: mark items done or undone by hand, and your ticks survive reload. A fresh plan from the model still wins over stale hand edits.
- **Publish over SFTP.** FTP publishing now speaks SFTP as well as FTP and FTPS: pick the protocol per profile, and on the first successful test Skales shows the server's SSH host-key fingerprint and pins it to the profile. If that key ever changes, the next upload is refused, so a swapped-out server can't quietly receive your files.
- **Goals can declare themselves done.** A long-running goal with broad criteria used to be nudged to keep going forever; the agent can now state completion explicitly once the work is verifiably done, and the checker respects it.
- **Isolated agents got a real household.** An isolated agent's generated and edited images stay in its own workspace instead of your gallery, downloads are confined to its folder with a hard size cap enforced mid-download, its dates are labelled UTC instead of your timezone, planner tasks run as the agent that owns them, and each agent can have its own email account without seeing yours.

### Changed

- **Multi-agent runs report in the conversation.** The per-agent progress trace now lives under the message that dispatched the job, and the finished report keeps a compact version of it, instead of a banner over the whole chat.
- **The Knowledge Graph got a proper physics engine.** The map lays out with d3-force, settles quickly at up to 300 nodes (up from 150), and stays smooth to drag, zoom and expand.
- **Media cards are forgery-proof.** Image and video cards in chat render only from real tool results, never from text that merely looks like one, so a model cannot fake a "generated file" card. Video bubbles from before this release show their file path as plain text instead of a card - the file itself is untouched.
- **Images open in the lightbox.** Clicking an image card in chat opens the full-size viewer; the dead "Open in Studio" link on media cards is gone.
- **One-tap deploy knows Cloudflare.** Deploying a Code-mode project now recognises a Cloudflare Wrangler setup alongside Firebase, Vercel, Netlify and an npm deploy script, and points you at your own CLI for anything else.
- **Skales IQ asks for an update when it needs one.** If a build is too old for the Skales IQ service, chat now shows a clear "install the latest update" message instead of a raw error.
- **Custom agents answer as themselves.** Ask a custom agent who it is and it answers under its own name (still honest about the model it runs on) instead of introducing itself as Skales.
- **WhatsApp knows who "me" is.** "Send it to me on WhatsApp" reaches the owner instead of the bot's own number, contacts saved in national format (0676...) match, and a failed media send explains the file path problem before anything leaves the machine. The isolated-agent chat badge became a lock icon.

### Fixed

- **Generated images render in chat and Flow again.** An image produced by the built-in generator shows up as a picture in the conversation and lands in the Flow project folder, on every backend - previously the turn ended early with a broken link.
- **Video generation works in the installed app on every platform.** The Windows build was missing the Google video engine and ffmpeg entirely, and every platform's package now carries the ffmpeg binary for its own operating system instead of the build machine's. Veo model names are consistent everywhere, so the tier you pick is the tier that runs.
- **Finished answers stop re-typing themselves.** At the end of a streamed reply the text no longer wipes and types out a second time.
- **Google Calendar tells you what is actually wrong.** The dashboard widget and calendar tools now name the real cause when the connection fails - an expired authorization (with the 7-day testing-mode hint), missing OAuth fields, or a network error - instead of a generic "reconfigure" line. And an empty week on a connected calendar links to the planner instead of suggesting you set up a calendar you already set up.
- **Web search fails forward.** A failed search names the fallback that will work (fetch the page, extract text), Windows gets shell hints that match its own tools, and the keyless DuckDuckGo path retries with a hard 25-second budget instead of hanging.
- **Three tools were invisible to the model.** A manifest generator gap hid connector building, connector requests and web search from the tool catalog in some setups; all 182 tools are listed again and a guard keeps future descriptions from silently dropping out.
- **A broken video clip cannot stall the chat.** Analyzing an uploaded video now stops sampling after a minute and answers from the frames it already has, instead of hanging on a slow or partly corrupt file.
- **The chat input can no longer stay locked.** In rare cases the composer stayed disabled after a reply finished (Enter and Send dead until a hard reload); a watchdog now releases it whenever no run is actually in flight.
- **A dispatched multi-agent job is always visible.** When the dispatching reply carried no visible tool card, the live worker chips had nowhere to attach and the job looked like nothing had started; they now attach to the latest reply instead.
- **Video renders stop making promises.** After starting a background video render the model no longer invents wait times or tries to poll a progress URL; it states that the render is running and where the finished file will appear.
- **Chat exports skip empty blocks.** A reply that only ran tools exported as an empty "Skales" section; exports now show a compact tools line instead, in both the /export command and the History download.
- **Background runs stop paying for the whole tool catalog.** Multi-agent workers, planner tasks and scheduled catch-up runs used to receive every tool definition (tens of thousands of tokens) on every single step; they now start from the same lean core set as chat and pull extra tool groups on demand. On a metered model this was the single largest hidden cost per day. GLM 5.x models get on-demand tool loading too, instead of always paying for the full catalog.

## v12.3.5 - Flying Gecko

Your knowledge graph comes alive, multi-agent jobs show every worker and finish on their own, and finished work stops being sent twice.

### Added

- **A living map of what Skales knows.** The Knowledge Graph on the Memory page is now a real, explorable network: it settles into shape on its own, you can zoom, pan and drag single nodes, and busier ideas sit larger with a soft glow. Labels fade in as you zoom so a dense graph stays readable, and an Expand button opens the whole thing full-screen. Light and dark both fit, and Reduce Motion drops straight to the settled layout.
- **Watch every agent in a team job.** When Skales fans a task out to several workers, the chat now shows one live chip per worker moving from queued to working to done or failed, with a running count and elapsed time, instead of a single "running" line. Click it to open the Tasks view.
- **A private scratchpad for each conversation.** Skales can now keep its own working notes for a chat and gets a private work folder per session, so intermediate files from one conversation never collide with another. Its notes come back to it at the start of every turn, so a long task keeps its train of thought.
- **Drop a video into chat and ask about it.** You can now attach a video (or drag one in) and have Skales actually watch it: it samples frames across the clip and reads them together, so you can ask what happens, check why a short is working, or figure out how a clip was made, its hook, pacing, cuts and on-screen text. Works with any capable model; camera clips just need FFmpeg, which installs from Settings.
- **Look through a camera.** Skales can now take a single frame from a camera on demand and tell you what it sees: an IP or WiFi camera address, or a camera already set up in Home Assistant (which is how a Ring doorbell is reached). Ask "is anyone at the door" or "what's in the garden", and pair it with a schedule to check a camera every few minutes and only ping you when something changes. It asks before looking, and needs a Vision Provider.
- **Isolated agents with a life of their own.** A custom agent can now be marked Isolated: it runs with its own memory, its own workspace folder and only the tools you hand it, and it never sees your identity, facts or saved memory - not even in the background passes that build your knowledge over time. Pair it with a pinned model, a bound FTP profile and a scheduled goal and it can run a project of its own, end to end. If its definition ever can't be loaded, the run stops rather than falling back to your data.
- **Publish a folder over FTP.** A new publish tool uploads a workspace folder through a saved FTP profile, and profiles can be bound to a single agent so only that agent can use them. FTPS (explicit TLS) is supported and switches on automatically when the server requires it, so hosts like Hetzner work out of the box.
- **Some Discover posts invite your agent along.** A post can now carry a "Let your agent explore this space" button: one tap prepares a visit for your own agent - it reads the site's welcome file, looks around and leaves a short guestbook comment, with your usual confirmations. You review the request before it's sent, and each post can be run once.

### Changed

- **Notifications carry their real button.** Announcements now show exactly the action label they were written with instead of a generic "Learn More", update notices get their own look with a one-tap jump to the in-app update page, and messages can be aimed at desktop or mobile users specifically.
- **Signing in by hand works everywhere.** The visible sign-in window for website logins no longer announces itself as an automated browser, so Google and other providers accept the login instead of blocking it as insecure.
- **Toast messages stay put.** Stacked notifications in the corner could leave an invisible gap behind that pushed each new toast lower until the stack drifted toward the middle of the screen. Old toasts are now always cleared, and any that a background window left stranded are swept up on the next one, so the stack stays anchored top-right.

### Fixed

- **A team job finishes on its own.** When Skales split a goal across several workers, it could stall once they finished and wait for you to nudge it. It now picks the goal back up automatically the moment the workers are done and carries it to the finish, whether or not the chat is open.
- **Finished work is never sent twice.** Re-checking a completed goal could re-run steps that had already happened, so a file or message could go out two or three times. Once a step has genuinely succeeded, its result now counts as proof and is never repeated to "re-verify" it.
- **Ask for an image, get an image.** When you ask for a picture, poster or graphic, Skales now creates it instead of handing back a text description of what it would draw. If no image provider is set up, it says so plainly and points you to Settings rather than quietly returning a prompt. And right after a big task wraps up, a follow-up like "now write the launch post" reuses what was just made instead of starting the search over.

## v12.3.0 - Flying Gecko

Flow checks its own work before handing it to you, long conversations keep their task, the calendar tells you what is actually wrong, and Skales stops getting in its own way mid-work.

### Added

- **Sign in to a website, once.** When a task needs you logged in, like posting on X or checking an order, Skales opens a visible browser window so you can sign in by hand. Your login is saved to the Skales browser profile and reused the next time, so it can work inside your accounts without ever seeing your password. Open a login window any time from Settings, Browser Control ("Log in to a website").
- **Watch the browser work.** A new "Show browser window" switch under Settings, Browser Control opens a real, visible browser window instead of running hidden, so you can see each step as it happens.
- **Multi-line scripts run without shell traps.** Skales can now write a script to a file and run it directly with the right interpreter (Python, Node, Bash, PowerShell) instead of squeezing code through a shell one-liner. On Windows especially, quotes, braces and special characters used to break perfectly good code before it even ran; that whole class of failure is gone.
- **Every file change has an undo point.** Before Skales overwrites, edits, appends to or deletes a file, it quietly keeps a copy of the previous version. If an edit turns out wrong, the earlier version is right there to restore, so a working script can no longer be lost to one bad change.
- **Self-built tools carry a freshness mark.** Each tool Skales built for itself now remembers when it last ran successfully. A tool that has not proven itself recently is marked as such, so Skales tests it before relying on it and reads it before changing it.
- **Flow checks its own work before handing it over.** After Flow builds or edits a deck, prototype, page, or visual, it now takes a picture of the finished result and looks at it the way you would, checking for text that runs off the edge, unreadable contrast, pieces cut off outside the frame, or a layout that has collapsed. If it spots a clear rendering problem it quietly fixes that one thing and shows you the corrected version. It makes at most one extra pass, never holds up a finished draft, and only steps in when a Vision Provider is set up. You can switch it off under Settings, Vision Provider.
- **Fill your memory graph from what Skales already knows.** Once you turn on learning in Settings, Memory, the Knowledge Graph can now be seeded in one pass from your saved long-term facts and a slice of your recent chats, instead of only filling up reply by reply going forward. Choose how much history to pull in, watch it count through in the background, and stop it whenever you like. Running it again never creates duplicates.
- **Your desktop makes Studio visuals for a connected phone.** When your phone is paired in remote mode but has no provider key of its own, it can now ask your desktop to build a Studio visual for it. The desktop generates it on the side and sends back the finished design, without ever adding anything to your chat history.
- **Friend Mode can reach your phone.** Turn on "Mobile App" in the Friend Mode channels and your desktop's proactive check-ins are sent to your paired phone too, where they land in your Buddy thread. It uses the same cooldowns and quiet hours as every other channel, and the message stays encrypted end to end.

### Changed

- **Browsing is faster, cheaper and more reliable.** Skales now reads and acts on web pages far more efficiently: clicks and typing land precisely, long browsing tasks cost noticeably less, and even smaller local models can drive the browser now.
- **The Proactive operator says what it is waiting for.** An empty operator pane on the Memory page used to show only "No initiatives yet", which read like a broken feature. It now explains what Skales is watching (upcoming meetings, failed scheduled tasks, blocked work, unread email) and shows when the last background check ran, so quiet genuinely reads as good news.
- **Skales reads before it edits.** Changing a file it has not actually looked at in the current session is now refused once, with the instruction to read it first. What is on disk can differ from what the model remembers, and blind patches on working scripts were the main way tools got destroyed.
- **Failing approaches now end in an honest question, not a seventh attempt.** When the same tool keeps failing, Skales first gets told exactly what failed and is pushed to step back and test one hypothesis at a time; if the failures continue, it stops trying on its own, summarizes what it attempted, names its best guess at the cause, and asks you for the one thing it needs. No more endless rabbit holes.
- **Unrestricted mode keeps its word.** A few command rules used to stay blocked even with Safety Mode set to Unrestricted. In true Unrestricted they now run instead of being refused, and the result card in the chat carries a clearly visible amber warning strip naming what was flagged, pinned to the exact command it belongs to and kept in the conversation history. Safe and Advanced keep their protections unchanged.
- **The working glow is easier to notice.** The ambient background that breathes while Skales works now drifts further, on a slightly quicker rhythm, and sits a touch more present at its peak, so you can actually see that something is happening. It stays well within readable contrast, idle stays still, and Reduce Motion still switches it off entirely.

### Fixed

- **Long conversations no longer lose track of the task.** In a long session, especially one with many working steps, Skales quietly fed the model only the most recent stretch of the conversation, so the original request could fall out of view while the context meter still showed plenty of room, and a later remark could be mistaken for the task itself. The model now always works from the full conversation, sensibly condensed, and the original request stays anchored no matter how long the session gets.
- **Work already done is not redone.** When a long task was interrupted and you asked Skales to continue, it could lose track of the files it had already written, claim a script was gone, and write it again from scratch. Skales now keeps a live list of everything the task has written, checks that each file is really on disk, and picks up from there instead of starting over.
- **Skales changes course instead of giving up.** When a step kept failing the same way, Skales used to stop with a generic "I got stuck" message, throwing away an otherwise healthy task. It now tells the model exactly which call keeps failing and why, blocks that one call, and pushes it to try a different approach; only if it still cannot move on does it stop, and the stop message now names the step that jammed instead of leaving you guessing.
- **The calendar tells you why it is empty.** If none of your configured Google calendars could be read, most often because a calendar's display name was entered where its ID belongs, Skales showed an empty calendar as if you simply had no events. It now says which entries failed and how to fix them, and the settings field explains where to copy the real Calendar ID from. One broken entry among working ones still does not disturb the rest.
- **The Memory page tells the truth about Knowledge Graph learning.** The graph card claimed new facts were extracted automatically after every reply, while that learning is actually a switch that ships off, hidden under a name nobody connected to the personal graph. The card now says plainly whether learning is on, and the switch that controls it lives right there with an honest name.
- **Skales knows which Safety Mode it is running in.** Asking which mode is active used to get you a guess or a request to check Settings yourself. Skales is now told its active mode and what that mode means, and answers directly.
- **Legitimate commands are no longer refused as dangerous.** A handful of everyday commands, such as scheduling a task on Windows or listing output with a format flag, were wrongly treated as system-destroying and refused regardless of your Safety Mode. Command safety is now decided in one place, honours your chosen mode everywhere, and only the genuinely destructive commands stay blocked.
- **Windows: scripts no longer crash on special characters.** A Python script that printed an emoji or other non-Latin text could die with an encoding error on Windows. Script output now uses UTF-8 there by default.

## v12.2.5 - Past Freeze

Your phone can now start, watch and stop the work your desktop does. Agents know who you are and what day it is. Vision lands on the right provider, the composer never stays stuck, and Flow stays out of your chats.

### Added

- **The chat background breathes while Skales works.** The accent glow slowly grows and drifts while your question is being thought through, stays a touch more present while the answer arrives, and settles back when it is done instead of snapping off. A running goal gets its own livelier, greener state, so you can tell at a glance that something is still working for you. The thinking dots and the status bar move on the same tempo. Nothing moves while Skales is idle, the animation stops while the window is in the background, and it is off entirely when your system asks for reduced motion.
- **Skales Mobile is on the App Store.** The Skales Mobile page now links the App Store next to Google Play, and the iOS button opens the store in your browser like the Android one. The in-app guide and roadmap note both stores are live.
- **Start a goal from your phone.** A request the phone marks as a goal now runs on the desktop as a proper background goal, on its own session with its own plan, instead of one long blocking reply. It keeps working after the phone acknowledges it, so you can close the app and come back to the result. Goals honour the Settings goal switch and need a real provider (your own key or a local model), like the scheduled goals.
- **Control a goal from your phone.** The Skales mobile app can now list the goals running on your desktop and stop, pause, or continue any of them. Stop and pause halt the live work at once, the same as the desktop.
- **Get notified on your phone when a goal finishes.** When a goal started from your phone completes, pauses for input, or stops on an error, the desktop notifies that phone, even if the app is closed. The notification is routed only to the phone that started the goal, and it arrives as its own message so it never interrupts whatever else you are doing in chat.
- **Your phone sees the live plan.** When the desktop works through a multi-step task from a phone request, it sends the same step-by-step checklist to the Skales mobile app, which shows it as a strip above the chat, updates it the moment a step changes, and brings it back when you reopen the conversation.
- **Goal and origin badges reach your phone.** The desktop now shares each session's goal progress and whether it started on a phone, so the phone shows the same goal pill and Mobile badge you see on the desktop.
- **Browse and fetch desktop files from your phone.** The phone's Workspace shows a Desktop folder while connected: browse your desktop workspace and pull any file (up to 2.5 MB) to the phone over the encrypted link. Read-only and strictly limited to the workspace folder.
- **Finish a connector's setup from your phone.** The Skales mobile app can now list your desktop's API connectors and complete the parts that used to require the desktop: confirm the connector's domain and set its key (and the client id and token address for OAuth2). The key is sent once, stored encrypted, and never read back; confirming the domain and setting the key stay separate steps.
- **Discover shows when someone forks a skill or template.** Forking a skill or a template now posts a short note to the feed, the same way sharing does, and only when feed sharing is turned on.
- **Safety Mode now has three levels: Safe, Advanced and Unrestricted.** Safe blocks dangerous shell commands and asks before critical actions. Advanced runs without asking and allows dangerous commands, while a residual guard still refuses the handful that would destroy the machine or its data outright. Unrestricted removes those last blocks too and, with file access also set to unrestricted, lets Skales reach system locations, install software and talk to hardware. If you were on the old Unrestricted, it is now called Advanced with identical behaviour, and a one-time note on first start points you to the new, genuinely unrestricted mode. You change it under Settings, Security, or during onboarding.
- **Name an image or video model in plain words.** You can ask for a model by loose name, for example "flux schnell", "gemini flash" or "veo 3.1 flash", and Skales matches it to a model your providers can actually run, picking the right backend for it. If the name is ambiguous it asks which one you meant instead of quietly falling back to a default.
- **Skales can set up an API connector from documentation, mid-conversation.** In Advanced or Unrestricted mode, after reading a service's API docs Skales can scaffold one of your REST connectors during the chat. The connector is saved switched off and without a key; you confirm the address and enter the key yourself under Settings, API Connector before it can be used, so the key never passes through the model.
- **API connectors speak OAuth2 (client credentials).** A cloud API that exchanges a client id and secret for an access token at a token endpoint, like Husqvarna or Gardena smart systems, now works as a connector: pick "OAuth2 (client credentials)" as the auth scheme, enter the token URL and client id, and put the client secret in the key field. Skales fetches and refreshes the token on its own, entirely on your machine. Static extra headers such as an application key are supported too.
- **Tools Skales builds for itself survive the session.** When Skales writes itself a working script, say a Bluetooth scanner or a TV caster, it keeps it. Every future conversation knows about those tools, so Skales reuses what it already built instead of starting over.

### Fixed

- **Agents now know your saved facts and today's date.** A custom agent, or an agent from the Agents page such as the Research Analyst, ran with its persona only: none of your Knowledge & Facts applied, and it did not know what day it is, so a web research report could carry the publication date of its sources as the report date. Every agent now gets the real current date, is told that a date found in a source belongs to that source and is never today, and receives the facts you saved. Agents that read the web are also held to the same rules about untrusted content as the rest of Skales.
- **Your saved facts survive minimal compression.** With compression set to minimal, or chosen automatically for a small local model, what Skales knows about you was shortened so aggressively that every entry under Memory, Knowledge & Facts fell away, so a fact you explicitly saved was simply absent when the model answered. Your saved facts are now always kept.
- **Stopping a running goal from the header now actually stops it.** The Stop control on the goal activity pill only marked the goal stopped without halting the work, so it kept running and reappeared on the next refresh. Stop and Pause now halt the live run at once. A stopped or crashed goal also no longer silently resumes itself on your next message: an interrupted goal is parked so it only continues when you choose Continue, and a goal that hit an error is marked failed and leaves the active list instead of looking like it is still running.
- **A long task no longer times out on your phone while the desktop is still working on it.** In remote mode a request that ran long (a goal, a slow build, one long model step) was given up on and its real answer dropped, and a retry re-ran the whole thing. The desktop now keeps the phone informed while it works, so the phone waits and the answer arrives.
- **OpenRouter works as your Vision Provider.** Switching the Vision Provider to OpenRouter kept sending image reads to whatever address a previous provider had left behind (a local Ollama, for example), so every read failed with a "not found" error even with a valid image model, while the exact same endpoint entered as a custom provider worked. OpenRouter now always uses its own address, a leftover address from a previous provider is cleared the moment you switch providers, and a "not found" error now names the model and how to correct its id.
- **The image description sits under the picture, inside your message.** The collapsed eye view with the Vision Provider's description floated above the message bubble instead of belonging to it. It now sits inside the bubble directly under the attached image, styled to read clearly on the bubble's background, both live and after reloading the conversation.
- **The composer no longer stays stuck after a reply stops responding.** If a reply stalled partway (a hung tool call, an orphaned run, a dropped connection), the input stayed locked with no way to send until you reloaded the page. It now releases on its own after a run goes quiet for too long, with a short note that you can send again, and without stopping whatever the server is still doing. Typing in very long conversations is lighter too.
- **Skales Visuals no longer times out while it is still working.** Creating an image or visual in Flow could fail with "the operation was aborted due to timeout" even while the model was actively writing, because a full single-page visual routinely takes a while. Flow now allows the whole generation and only gives up on real silence, and when a timeout does happen the message explains what stopped and suggests trying again or picking a faster model.
- **Forked and created templates appear in your library.** Forking a template from Discover, or creating one, showed a success message but the template never appeared under Templates, because the library never read your saved custom templates. They now show up with a Custom or Forked chip and a delete button, so a mistaken fork is not permanent, and a forked template carries its full prompt instead of a short preview.
- **Flow projects stay out of your chats.** A Flow (Studio) project could surface as a recent chat on the dashboard, in history, in the command palette and on your mobile device, and finishing a Flow turn popped a "finished your chat reply" note that opened the Flow conversation inside the chat view. Flow projects are now kept out of every chat list, a finished Flow turn shows a Flow note that reopens the workspace, and opening a Flow project link sends you to Flow instead of rendering it as a chat.
- **Long answers from Ollama Cloud models no longer cut off mid-sentence.** A strong model served through Ollama Cloud was limited to a small answer length regardless of what it could actually write, so longer replies stopped partway. Each family now uses its real answer length, and you can still raise it under Override Model Limits.
- **Ollama Cloud models use their tools instead of just talking about them.** A frontier model running on Ollama Cloud was treated as if it were small hardware on your own desk, so it described what it would do instead of doing it, and a slow first response could wrongly mark it as not supporting tools at all. These hosted models are now recognised for what they are.
- **Reasoning no longer leaks into the chat as "[thinking]" text.** Some models write their private reasoning inline using square brackets, which showed up as literal "[thinking]" text in the reply. That reasoning now goes into the collapsed Reasoning section like every other model, and the visible answer stays clean.
- **Image generation works when your only provider is fal.ai or Replicate.** Asking for an image in a chat or a Flow could return a written description instead of a picture when the only image key you had configured was fal.ai, or a Replicate key stored the newer way, because those two were overlooked when deciding whether to offer image generation. Every image provider you have configured is now recognised, so the tool is offered whenever any of them can produce an image.
- **A PowerShell display command is no longer mistaken for disk formatting.** Formatting command output for display (for example listing Bluetooth devices with Format-Table, Format-List or Format-Wide) was refused as if it were a drive-format command. Only real drive formatting stays blocked now; the display formatters run.
- **Pairing a phone opens the right panel and confirms right away.** After scanning the pairing QR code, the panel jumped to Settings instead of Connected Devices, and a scan showed no confirmation until a background refresh caught up. It now opens Connected Devices immediately with a success note.
- **Removing a paired phone really cuts it off.** Removing a device only closed the current connection, so the phone could quietly reconnect on its own. Removing a phone now tells it to forget this computer and refuses to re-pair it until you deliberately show a fresh QR code, so a removed device stays removed.

### Changed

- **The interactive Playground is taking a break.** The mini-app builder is temporarily unavailable while it is reworked and will return in a later release. For now its sidebar entry, its Settings tab and its Add-Ons card are hidden, including for anyone who had it switched on.
- **Skales IQ is described as free included usage, not a trial.** The Skales IQ copy now makes clear it is free included usage rather than a trial of a paid plan, with nothing to buy: when the included usage runs out you connect your own provider and everything keeps working. Added an explicit "this is not a subscription" line to the Skales IQ settings box.
- **Flow places your attached images instead of redrawing them.** In a design or build project, an attached image is now described so the model knows what each file shows and embeds the actual file where it fits, instead of trying to recreate the picture in code. In an image or video project the attachment still passes straight to the generator untouched, so an edit works on your real picture.

## v12.2.0 - Freeze

The first release after the freeze: images answer with the model you chose, the ChatGPT subscription works everywhere, and profiles keep their full guidance.

### Fixed

- **Synced model profiles keep their full guidance.** An imported tuning profile's guidance text was cut at 600 characters on import, which silently truncated every profile in the shared library mid-sentence and dropped the tail of the instructions. The bound is now generous enough for a real multi-rule hint, and a profile that still exceeds it is logged instead of being trimmed in silence.
- **Images keep your chosen chat model.** When a dedicated Vision Provider read an attached image, the answer was silently handed to a different model than the one you picked (a local vision model, or a small cloud fallback), so the reply looked like it came from the wrong place and, on paid providers, billed the wrong model. The picture now goes to the vision model only when a raw image is actually sent; once the Vision Provider has described it, your chosen chat model answers. Vision-capability detection now reads what the local model actually reports instead of guessing from its name, a Vision URL that already points at the chat endpoint is no longer mangled into a broken address, an explicitly chosen local vision model is attempted instead of pre-blocked, and the image-related tips and error messages now point at the Vision Provider settings. Profiles can also carry a vision-capability override so a new model is recognised without an app update. A picture and its description are now saved with the conversation, so the very next question ("what did you see?") is answered from what was actually read instead of "I do not remember", and a failed image read no longer vanishes from the history. The saved description shows under the image as a small collapsed eye accordion (like the reasoning view), never as raw text in the bubble.
- **The ChatGPT (Codex) subscription is selectable everywhere.** A signed-in ChatGPT account never appeared in the model pickers (new-chat landing, in-session switcher, picker search, agent and Codework provider dropdowns) because those lists only recognised API-key credentials; the subscription sign-in now counts as configured and the Codex models show up like any other provider's. Flow already offered it.
- **Every surface reads image capability from one place.** Telegram kept its own list of which models can see, with the multimodal gemma3 and gemma4 families wrongly marked text-only, and several surfaces disagreed about what counts as a local vision endpoint. Chat, Telegram, WhatsApp and the desktop buddy now decide this the same way, a pasted address is tidied up first, and the buddy no longer insists on a vision model id where every other surface accepts the built-in default.
- **The ChatGPT (Codex) subscription is on one tested path.** The plain-chat and tool-using code for a signed-in ChatGPT account had drifted into two hand-copied copies, which is how the subscription kept breaking one release at a time; both now share a single request builder and stream parser covered by tests, so a fix can no longer land in one and miss the other. The current model list gained GPT-5.5 (an up-to-date id was falling through to the manual entry field), and a short-lived access token is now refreshed automatically before a turn instead of leaving a still "signed in" account failing every message until a manual sign-out and sign-in.

## v12.1.1 - Freeze

Long-running tools, portable backups, and Flow polish.

### Added

- **Send several images in one message.** Pasting, dragging or picking multiple pictures used to keep only the first one; now up to five images ride along per message, on the new-chat landing as well as in a running session. Each queued image shows its own preview with its own remove button, a shared window capture joins the same queue, the model receives all pictures in one turn (a dedicated Vision Provider reads each one and hands over numbered descriptions), all of them are saved with the conversation and shown in the bubble, and editing a message that carried several pictures resends all of them.
- **Discover marks mobile posts.** A post made from the Skales mobile app shows a small phone icon next to its timestamp, matching the marker in the mobile feed. Under the hood the device bridge gained session control and a tool catalog for the next mobile release; everything is additive, a current mobile app is unaffected.
- **Wrapped share cards get more looks.** The weekly recap card now offers nine themes (Skales, Obsidian, Snowfield, Neon, Sunset, Rose, Aurora, Grape and Teal), each in a light and a dark variant, chosen from a swatch picker right above the card. The choice is remembered for next week, and the download, copy and share-to-Discover buttons all export the themed card.

### Changed

- **Flow designs with a stance now.** Every authored mode carries a design essence on top of its structural seed: commit to one aesthetic direction instead of a safe generic middle, name the system (layout family, fonts, background rhythm) before building, let typography carry the hierarchy, give each artifact one hero moment, treat whitespace as material, and make requested variants genuinely divergent. Each mode adds its own craft posture - slides think in sequence rhythm, motion thinks in beats with anticipation and one reveal, mockups respect platform conventions and touch targets, wireframes stay deliberately negotiable, documents read as typography with structure - each with concrete taste anchors. Real photography from Unsplash and Pexels joins the asset sourcing (downloaded into the project, never hotlinked), and a design that wants more typographic character may swap the seed's font tokens for a characterful pairing; motion compositions stay fully offline.

### Fixed

- **Windows commands run in the right PowerShell.** Agent commands on Windows were hardwired to `powershell.exe`, which is always Windows PowerShell 5.1 - a shell that rejects `&&`/`||` chaining, so every chained command a model wrote failed and had to be retried in single steps, burning time and tokens. Skales now runs agent commands in PowerShell 7 (`pwsh`) whenever it is installed and only falls back to 5.1 without it; on top of that, the agent is told exactly which shell it is in (in chat, Codework and the Telegram bot alike), so even on 5.1 it writes `;`-separated PowerShell commands correctly on the first try instead of learning it from errors. Linux setups also get their own platform hint instead of borrowing the macOS one, and the batch-folder shortcut in the prompt now shows Windows syntax on Windows.
- **Discover links that contain a `#` are clickable again.** A shared or auto-posted link whose URL had a fragment (the `#section` part, e.g. a Wikipedia section or an app deep link) had that fragment mistaken for a Discover hashtag: it was pulled out and highlighted as a tag, leaving the rest of the URL as dead, unlinked text. Feed post text now recognises URLs first, so the whole link stays one clickable link (opening in your browser) and only real standalone `#hashtags` are highlighted.
- **Backups no longer lose FTP passwords or stored secrets across machines.** The portable-secrets export covered the settings and connector keys but missed the two stores that encrypt in a different format (the internal secret store and saved FTP profile passwords); those travelled as the source machine's ciphertext and, with the encryption key deliberately kept local, silently vanished on restore to another machine. They now travel in the same portable form and are re-encrypted with the receiving machine's key; anything genuinely unrecoverable is reported instead of dropped.
- **The 1:1 Wrapped card is square again.** The share card labelled 1:1 was rendering as a cropped portrait: sized as a flex item, it was squeezed narrower than intended while its height stayed fixed, so the content overflowed and the corners were cut off, and the exported image inherited the same wrong shape. The card now holds its exact intrinsic size, the on-screen preview is scaled separately to fit the window, and the content is measured and scaled to fit the box, so 1:1 exports a true 1080x1080 square and 9:16 a true 1080x1920, with nothing clipped in any language.
- **Custom skills can be shared to Discover again.** The Skill AI generator added `require('fs')` and `require('path')` at the top of every skill even when the skill never used them, and the share screen rejects any skill that touches the file system. A share now strips those unused requires first (a require that is actually used still stays and is still screened), so a pure-compute skill is no longer blocked by dead boilerplate, and newly generated skills omit the unused imports.
- **Detect Ollama knows about Ollama Cloud.** With Ollama Cloud switched on, the Detect button and the failure messages used to tell you to start a local daemon (`ollama serve`), which is nonsense for the hosted service. They now point at your Ollama Cloud key and connection instead, and the provider is simply labelled "Ollama" (not "Ollama (Local)") since it can be either.
- **The Telegram bot names the real problem.** A network drop while polling (DNS failure, reset, timeout) was logged as "bot may have an invalid token", sending you to check a token that was fine. Network errors are now labelled as network errors (and recover on their own), and only a genuine rejection from Telegram is reported as a token problem.
- **API connectors that need two query credentials work now.** Some APIs authenticate with a public application id next to the secret key, both in the query string (Adzuna's `app_id` + `app_key` is the common one). The connector could only carry a single credential, so these always failed. A connector now has an "Extra query params" field for the public companion (sent in the clear, never encrypted, kept out of the model context), the secret query parameter's name is editable instead of a fixed `api_key`, and the docs importer recognises the two-parameter pattern automatically. On top of that, saving a connector with an auth scheme the request layer does not understand is now rejected with a clear message instead of silently sending an unauthenticated request that reads back as the API rejecting the key.
- **MCP tools get the time they need.** Every MCP request was cut off after a blanket 30 seconds, which aborted legitimately long operations (video analysis, renders, large scrapes) in the middle of their work. A tool call now has five minutes by default, each server can raise or lower that on its own up to 30 minutes, and the quick control requests such as connecting and listing tools keep their short timeout so a hung server is still detected fast.
- **Ollama reads images reliably, including Ollama Cloud.** Pictures sent to Ollama went through the OpenAI-compatible endpoint, which the hosted vision models answer with a server error; the same models describe the same image fine on Ollama's native chat endpoint. Skales now routes image turns over the native endpoint automatically - no setting, no URL to change - and text conversations keep exactly the path they had.
- **Claude over OpenRouter stopped re-paying its own prompt.** The direct Anthropic connection has long cached the static prompt prefix (tool schemas plus system prompt), but the same Claude model routed through OpenRouter sent no cache marker and re-billed that whole prefix on every turn. Claude models through OpenRouter now reuse their cached prompt the same way the direct connection does, so long conversations cost what they should; the volatile clock line stays outside the cached span so the cache survives minute boundaries, and every other vendor's request is untouched.
- **The OpenRouter speech model is actually spoken through now.** The provider card has offered a speech (TTS) model slot, but no read-aloud surface read it: chat read-aloud fell back to the system voice and voice notes only ever used the dedicated voice providers. With an OpenRouter key and a speech model configured, read-aloud in chat, WhatsApp and Telegram voice notes, Studio voice and the AIPointer overlay speak through OpenRouter first; an explicitly chosen voice provider (ElevenLabs, Azure, OpenAI, local) still wins.
- **Settings backups travel between machines.** Exports now carry secrets in a portable form while the local encryption key never leaves the machine; imports re-encrypt everything with the receiving machine's key instead of overwriting it, older backups migrate automatically, and anything unrecoverable is reported instead of silently dropped.
- **Thinking stays out of the chat.** Reasoning models (the DeepSeek, Qwen, GLM and MiniMax families among them) that spent a turn thinking could get their entire thinking transcript posted as the visible answer, in Flow a wall of inner monologue instead of the design file. The trace now stays on its own collapsed channel: a turn that burned its budget mid-think recovers with a re-request instead of dumping the transcript, an answer cut off inside its thinking block is treated as thinking, and the Flow live preview hides inline thinking while the model works. Plain helper calls on local reasoning-only models keep working as before.
- **The Flow window lost its redundant close button.** Flow runs in its own window, so the corner X only duplicated the window's own close. The project-files button moved into the preview and editor toolbars as the first icon of one right-aligned row next to the other actions.
- **The Flow composer got wider.** The attach button now sits above the send button in one column, so the message field takes the full remaining width.
- **The Start button looks like a button again.** Inside the Flow window it rendered without its styling; it is now the same accent icon button as the chat send button, and the scoping-questions Continue and Brand-Kit create buttons got the same treatment.
- **Editing a message keeps its picture.** Editing a question that carried an image resent only the new text: the image was silently dropped and the model answered blind. The edit now re-attaches the original picture from its saved copy (with the in-bubble thumbnail as the fallback), so a reworded question about an image still sees the image.
- **The new-chat page remembers your agent.** The agent picker on the chat start page reset to Skales on every visit, so anyone who mostly chats with one custom agent had to reselect it each time. The picker now remembers the last choice for the next visit. Skales stays the default character: nothing is stored until you pick someone else, picking Skales again clears the memory, and a deleted agent falls back to Skales.
- **Approving a phone-driven action replies to the right message.** When a chat run from the Skales mobile app pauses on a tool that needs confirmation (sending an email, pushing to git, running a command), the desktop asks the phone to approve or reject and, once you decide, sends the result back. That reply now carries the conversation's id through the whole approve-reject round-trip - the initial request, any follow-up approval, the final answer and the error path - so the phone pairs it with the exact message that was waiting instead of guessing by order, and a reply missed while the phone was briefly offline still settles cleanly. Local and non-mobile use are untouched.

## v12.1.0 - Flow

Design by conversation. Studio gets a new front door.

### Added

- **Flow, the conversational design workspace.** Open Studio and describe what you want; the Skales agent designs it as real files, with a live preview, the files and the code sitting next to the conversation. Eight modes cover the ground: slide decks, interactive prototypes, wireframes, mobile app mockups, print documents, generated images, generated videos, and motion graphics that render to a real MP4. Every mode carries its own design discipline, so the first result already looks deliberate instead of improvised. Flow is a beta.
- **Flow opens in its own window.** In the desktop app, Flow gets its own window so you keep working in chat and the other tools while a design generates. In the browser it stays an in-app overlay.
- **A composer that carries real controls.** Attach up to ten files (documents like PDFs become content sources the agent reads, not decoration), reference an earlier Flow project, pick a Brand Kit, pick a template, and choose the model and reasoning effort per project. The model picker searches the same live catalogs as the chat page, favourites and recents included.
- **Brand Kits drive the design, including what to avoid.** The Brand Kit gained fields for what the brand is, reference links the agent studies before designing, free design notes, and explicit bans: fonts, design directions and anything else that must never appear. Activating a kit in Flow makes the palette, the typography and the bans binding for every artifact, and a toggle makes the logo and uploaded brand assets a requirement, not a suggestion. New kits can be created right inside Flow; the settings page remains the full editor for the default kit.
- **Templates that shape the output, not just the prompt.** Picking a template (pitch deck, invoice, dashboard, logo reveal, ...) binds the right mode and injects a structural directive into every turn of the project, so a pitch deck follows a pitch deck's arc even five edits later.
- **Media generation with a choice of engine.** Image and video modes list every backend that is actually usable right now: connected MCP media servers, the configured cloud providers, local engines, and Skales Visuals, the built-in engine that designs images and videos itself, at the exact format you asked for, no external image model needed. Pin one, set aspect, resolution, quality and duration, and optionally name the model you want.
- **Generated images can be edited by talking.** Ask for a change after an image lands ("make the keyboard white") and the agent treats it as an edit of the existing file, through the image-edit tool or the media server's image-to-image, saving each revision as a new file.
- **Skills and connectors answer to "@" in Flow.** Typing "@" in a Flow composer lists your imported agent skills and connected MCP servers; a mention activates the skill or steers the turn to that server, the same way the chat composer does it.
- **Flow artifacts land in the shared gallery, and images can go to Discover.** Generated media is mirrored into the Studio gallery automatically, every turn shows a card of the files it produced, and any image artifact can be submitted to the Discover feed, compressed and reviewed before it appears.
- **Discover can now carry video posts.** The feed renders link-based videos with a muted inline player that respects the clip's format, moderated the same way as images.
- **OpenRouter carries every modality now.** One OpenRouter key no longer means text only: the provider card gained per-capability model pickers, fetched live from the catalog and filtered to what each capability actually accepts, for image generation, video generation, music, speech (TTS), transcription (STT) and embeddings. Image models join Studio and Flow as a first-class engine, video models generate through the async job API with honest progress and errors, voice input can transcribe over OpenRouter, read-aloud can speak through a dedicated speech model with a voice of your choice, and the semantic document index can embed through OpenRouter as well.
- **Skales IQ inherits the same breadth, tier by tier.** Skales IQ now understands every modality (chat, vision, image, video, music, speech, transcription, embeddings), and what your plan can do is managed per tier and can grow without an app update. A capability that is off or not in your tier answers with a clear message in chat instead of a cryptic failure, the same way an offline Skales IQ already does.
- **Drag and drop lands in ongoing chats.** Dropping a file onto the composer of a running conversation now attaches it, PDFs through text extraction, images to the vision slot, text inline and archives to the Workspace, exactly like the paperclip. The starting page accepts PDFs and archives too, and a PDF that cannot be parsed still attaches with a Workspace copy instead of being skipped.
- **Flow asks before it builds.** On the first turn of a project, when the brief leaves essential decisions open, the agent poses a handful of tailored scoping questions rendered as a clickable form in the preview pane: option chips, multi-select where several picks make sense, a free-text field and "Decide for me" per question. Continue sends the picks back and the artifact is built to them; a clear brief skips the questions entirely.
- **A template gallery on the Flow home.** All twelve templates fan out as cards under the composer; hovering one previews its brief right in the prompt box, clicking binds the matching mode and structure, and a blank-project link sits below.
- **Change course mid-project.** The Flow workspace header carries a small toolbar: switch the model (with live catalog search) or switch and deactivate the Brand Kit for the next turn, without leaving the project. The workspace composer gained an attach button too, so fonts, images and archives can join a running project, and a live token counter shows what a run actually costs.
- **Skales unpacks zip archives.** A new extract tool unzips archives natively (no shell), guarded against path escapes, available to the agent in chat and everywhere else. A zip attached in Flow is unpacked automatically into its own assets folder.
- **Ollama Cloud, one switch away.** The Ollama card gained a Cloud toggle in its own row: flip it, paste your ollama.com account key, and Fetch Models fills the regular model list with your hosted models, no local install involved. Detection doubles as a cloud connection check, the local-install sections (setup, marketplace, the local tool cap) step aside in Cloud mode, and the hosted frontier-size models are treated as the cloud models they are, with none of the local limits.
- **Your OpenRouter choice leads.** When OpenRouter is the active provider or one of its modality models is pinned, image generation, voice transcription and read-aloud speech go through OpenRouter first; the other configured providers remain fallbacks.

### Changed

- **The classic Studio surfaces moved behind one "Studio v1" group.** Design, Media, Audio, Type, Scenes and Gallery keep working exactly as before, folded into a collapsible rail entry below Flow while Flow is the front door.
- **The Studio landing for Flow is honest about readiness.** One column: the checks on top with a wide open button, the explanation below. Configured MCP servers count as ready (they connect on first use), and the media row mirrors, key for key, what the image and video pipelines actually accept.

### Fixed

- **Vision Provider with OpenRouter returned a 404.** OpenRouter needs vendor-prefixed model ids, and the vision path sent the bare id the settings carried. Bare ids of known families get their prefix automatically now, switching the vision provider prefills that provider's known-good default model instead of carrying the previous one along, and the model field shows a provider-aware example.
- **A text-only local model no longer silently becomes llava.** When the active Ollama model cannot see images, Skales now looks at which vision models are actually installed and uses one of those; with none installed it says exactly that, with the pull command, instead of failing with a confusing missing-model error. Detection also recognizes cloud-suffixed and differently-spelled tags of the multimodal families.
- **A #trigger routes to its API connector, deterministically.** Typing a connector trigger in chat now pins the turn to that connector instead of hoping the model picks it over web search or an MCP tool, a trigger saved with uppercase resolves too, and a connector whose docs yielded no endpoints says so in Settings instead of failing quietly.
- **The command highlight keeps its place.** When the colored command overlay appears mid-draft in a scrolled composer, it aligns to the text in the same frame instead of showing the caret on the wrong line, in the chat session and on the starting page.
- **The reasoning-effort tooltip is shorter.** The dial says what level is active without the click-to-cycle lecture.
- **The per-modality model pickers actually fetch now.** A key-handling fault made every fetch quietly fall back to a static text list, so the pickers looked empty. Fetching works now, the public catalog even loads without a key, and the pickers moved from a native browser datalist onto the app's own dropdown, loading their catalogs automatically when the panel opens.
- **PDF attachments work in the packaged app, not just in development.** Packaged builds shipped without the PDF text extractor, so every extraction failed silently while development worked fine. The packaged app now carries it.
- **Long generations are never cut off anymore.** The per-request timeout used to stay attached to a streaming response, so a model that was actively writing a large file for minutes was aborted mid-work with a timeout error. The timeout now only bounds the wait for a response to begin; once a model streams, only genuine silence on a dead connection ends a run, and the Stop button remains yours.
- **The Flow chat can be read while the agent works.** Auto-scroll only follows the newest message when the view is already at the bottom, instead of fighting an upward scroll.
- **Fixed-format compositions fit the preview.** A 1920x1080 motion graphic (or a 9:16 reel) scales to fit the pane instead of running off screen, and Motion gained format and duration controls that the composition and the renderer respect.
- **Flow projects stay out of the chat history.** Flow sessions no longer appear as regular chats in the sidebar, History or the command palette; they reopen from Flow's own project grid.
- **Small but annoying, fixed in Flow.** The code editor no longer collapses to a strip, a long model name no longer pushes Start to the next line, cloud-generated images and videos show real thumbnails in the project grid, the mode chip rail lost its stray dark box, and the Flow window in the desktop app wears the same hidden-inset chrome as the main window.
- **Flow works on a narrow screen.** Opened from a phone browser (Tailscale on the go), the workspace stacks chat above the live preview instead of hiding the preview, dropdown menus clamp to the viewport, and the template gallery wraps into rows. On desktop, the gallery breaks out of the column so no card is cut off and the hover lift is never clipped, and the mode chips shrink to fit one line.
- **Picking a template no longer types into your prompt.** A chosen template shows its brief as the placeholder (exactly what hovering previews) instead of inserting text that survived switching or clearing the template; with the box left empty, Start uses the template's brief as is.
- **LLM Profiles no longer flatten Flow designs.** Profiles keep weaker models precise while they operate tools, which is right for ordinary work but wrong for design: DeepSeek and MiniMax were composing Flow layouts in that precise mode, and the results came out flat and generic. Flow now keeps the model's full creative range while it designs; everything else stays precise.
- **Agent-written documents reach the Document panel again, proactively.** Documents the agent wrote were invisible to the panel, a fresh chat never told the model the panel existed, and weaker models wrote documents as plain chat text instead. All three fixed: ask for a summary, article or report in any new chat and it lands in the panel, opens rendered on a wide window, and lights the header dot on a narrow one.

## v12.0.0 - Solid

Two steps ahead. (This entry covers the work landed so far; the release is still in build.)

### Added

- **A format for role bundles.** Skales now has a defined format for a role bundle: one folder that carries the skills, connectors and slash-commands for a job role, with a loader that validates it before anything uses it. A bundle is only sound if every connector it ships is reachable through a skill or command, so a role arrives complete instead of as a connector with no skill that uses it. There is no install screen yet; this is the groundwork, with an example bundle in the developer kit.
- **Skales learns from your finished work, and the learning is yours.** When a goal hits friction and finds a way through, Skales keeps what worked as a short, reusable approach and notes what to avoid, so the next job of that kind starts ahead instead of from scratch. The approaches it leans on get sharper the more you work, since it favours the ones that actually reach a good result and quietly drops the ones that do not, and a quick "that's perfect" or "that was wrong" on a finished goal counts. The memory page shows each lesson with a quality mark, lets you pin the ones you rely on, and delete anything you do not want kept. It is a plain file on your computer that you own and can read.
- **Tell Skales to remember.** Say "remember this" or "from now on...", and it keeps that as a first-class note that surfaces first the next time it is relevant.
- **Skales stays a step ahead.** It surfaces a meeting that is about to start or a scheduled task that did not run, quietly prepares for a meeting that has an agenda before you ask, and gathers everything else into one calm daily briefing instead of a stream of pings. The memory page shows what it got ahead of and why, and you can mute it in notification settings.
- **Skales names your chats for you.** A new conversation gets a short, specific title drawn from its first exchange, the way you would name it yourself, instead of the first line of your message. The placeholder appears at once and is replaced when the title is ready.
- **Show an image you already have.** Skales can display an existing image file from your workspace right in the chat, so a picture you or a connected service saved appears inline instead of being described or pasted as raw data.
- **A dot shows when a document is waiting.** The document button in the chat header now carries a small mark whenever the current chat has a document but the panel is closed, so an artifact Skales wrote, or one in a chat you reopened, is easy to find instead of hidden behind a closed panel.
- **Delete your Skales IQ trial data yourself.** A new control in Settings, under Skales IQ, removes your trial record from our server and switches off its key in one click. The signup now also says plainly why your email is kept, to prevent abuse and to offer you a later upgrade or credit, and that you can remove it whenever you want.
- **Codework templates are back in the library.** The Templates page has a Codework category again, with ready-made coding tasks, fixing a bug, writing a test suite, refactoring, scaffolding an API endpoint and more, that open straight in Codework with the task already filled in.
- **Find your real models, not a fixed list.** The model switcher now shows the models you actually have. Your favourites and recently used sit at the top, and a search field finds any model across every provider you use, your real OpenRouter, Gemini, Anthropic and Ollama models, instead of a short hardcoded lineup. A star keeps any model one tap away, the same in the in-chat switcher and on the new-chat screen, and a local model server that is not running drops out instead of listing dead entries.
- **Pick who answers and which model before you start.** The new-chat screen has its own row under the box for the agent and the model. Choosing an agent fills in its model for you, and you can switch to any other model just for this chat without changing your default. The choice sticks to that conversation and is still there when you reopen it, and a later switch inside the chat sticks too.
- **A new in-between coding mode for Chat.** Between Code, which asks before each edit, and Auto, which works on its own, there is now an Edits mode: it approves your file edits as it goes but still asks first before a shell command, a git push or a deploy. Pick it from the same Chat, Code, Plan, Auto strip.
- **Plan mode hands you the plan to approve.** A folder-bound chat in Plan mode now writes out its finished plan and waits for you to approve it before anything runs, instead of switching to Code and starting on its own. You read the exact plan, then approve to build it.
- **Choose how much Codework may touch.** A new file-access setting runs a project read-only, lets it edit, or lets it edit but never delete. Deleting a file always needs an explicit yes, whatever the setting.
- **Chat reads your project's own rules.** A folder-bound chat in a coding mode now reads an AGENTS.md (or CLAUDE.md) at the folder root and follows it, so your project's style, test runner and conventions carry into every reply without you repeating them.
- **Codework remembers your project across runs.** Before it starts, Codework reads an AGENTS.md (or CLAUDE.md), memories.md or branding.md at the project root and follows it, so its work keeps to your conventions and tone every time instead of relearning them.
- **Codework tells you when it is done.** A finished or interrupted Codework task now raises the same toast, chime and sidebar mark as a chat, so a task you left running reaches you even when you are on another page.
- **Your activity recap covers the tools you actually reach for.** Using an MCP tool or a Hugging Face Space, creating a template, and exporting any Studio video (not only a text animation) now register in your Discover activity and your weekly Wrapped, instead of going unrecorded. Wrapped also keeps the model you leaned on most for the week and tells your Chat, Code, Plan and Auto time apart.
- **A home you choose: Calm or Power.** The dashboard opens in one of two layouts and remembers which one you picked, so it looks the same the next time you open it. Calm keeps it personal: pick up where you left off, jump back into recent chats, what Skales has on its mind, your most active surfaces, and quick ways to start. Power is for getting work done: your active goals with their real progress, Autopilot status with this hour's API calls and anything waiting on your approval, your provider balance, your connections and paired devices, and live runtime memory, CPU and uptime. Your own avatar emoji greets you, the current weather sits under the greeting, and your weekly Wrapped badge rides in the header with a tap straight to the recap.
- **Your briefing, in a single line under the greeting.** When you have joined a Briefing in Discover, its latest items rotate through one calm row and open in the built-in browser on click. When you have not joined yet, that same row invites you to, so the home screen is where a briefing begins.
- **A balance you can trust, or nothing at all.** Running on Skales IQ or OpenRouter, the Power view shows your real remaining balance with a gauge. Skales IQ shows the percentage of your trial left, exactly like the Settings box; OpenRouter shows your remaining credit in dollars. For a subscription or a key that exposes no balance, the card simply does not appear, rather than inventing a percentage.
- **Your week, at the top of the home screen.** A seven-day strip under the greeting lays out the current week, with the events and planner tasks for each day, and today marked. Empty days stay empty rather than guessing. It is there in both Calm and Power, and any day opens the Planner.
- **Pick up where you left off, in both views.** The one-click way back to your last session now sits at the top of Power too, not just Calm, so getting back to work never means hunting through History.
- **Real runtime health, measured not guessed.** The Power view reads the backend's actual memory, CPU and uptime live and labels them as the runtime's own, instead of the browser-heap placeholder the old system tile showed. Nothing on the home screen is a stand-in number.
- **Home widgets that all show real data.** The optional-widget strip gains your latest Studio work, your running goals, the next scheduled goal, your latest Briefing items, your Wrapped badge, your online team devices, and your most-used surfaces. The empty Quick Chat box, the duplicate memory cloud, the buddy-mood tile and the placeholder system tile are gone.
- **Choose how deeply the model thinks, per chat.** A small dial next to the message box steps through four levels of reasoning effort, and its circle fills and shifts colour as you go up: an empty yellow-green ring for the lightest, then half blue, a full orange, and a full red for the deepest. The dial follows the model you have picked. On models with a real reasoning control, Claude Sonnet 5 and the newer Opus, and reasoning-capable models through OpenRouter, it drives that control directly. On models that have none, your local models, custom endpoints and most direct providers, it shows a muted "none" ring and steps aside, so it never claims a depth the model cannot deliver and the message box never shifts when you switch models. The level stays with that conversation, and the dial is on the new-chat screen too, so a level you pick before the first message rides into the session. Once you raise it, it takes over from the global deep-reasoning switch for that chat; a fresh chat, or the dial back at its lightest, follows your global setting.
- **Claude Sonnet 5 is ready to use.** Sonnet 5 is in the Anthropic model list and runs with its adaptive thinking on by default, with its output length and long-conversation compaction sized for it, so a long answer no longer cuts off early.

### Changed

- **Trivial turns feel instant.** A greeting, a thanks or a quick "ok" skips the heavy setup a real task needs and answers right away, with no thinking card sitting above a one-word reply.
- **Deep reasoning reaches more of your work, and stops wasting itself.** With the xhigh deep-reasoning boost turned on, a Codework run now plans as carefully as a chat or a goal already did, so a coding job gets the same care. And a greeting or a quick thanks no longer triggers a full reasoning pass, so those pleasantries stay instant.
- **The reply box frees up the moment your answer lands**, instead of waiting on background bookkeeping, so you can keep typing without a pause.
- **A tidier message box.** The magnifying-glass and slash buttons are gone from the message box. Both only opened things you already reach by typing "/", which lists every command as you type, so the reasoning-effort dial takes the slash button's old spot. The small labels on the message-box buttons now appear the instant you hover instead of after a pause.
- **A document Skales writes opens ready to read.** It opens rendered, the finished look, instead of as raw markdown; switch to the editor when you want to change it.
- **It feels like a native app, not a web page.** The pointer is the system arrow over buttons and links instead of the web hand, and every dropdown is a real, keyboard-friendly menu that matches Skales rather than the raw operating-system control.
- **Clearer empty and error screens.** When a list has nothing in it yet or something fails to load, Skales shows a short explanation and a way forward, like try again, adjust filters or start a chat, instead of a bare spinner or a raw error line.
- **Every tile on the home screen goes somewhere.** Each card, stat and list on the dashboard now opens the thing it stands for, a chat, a goal, a memory, a setting, the schedule, the briefing, instead of sitting there as text. The old capability grid that led nowhere is gone.
- **Your recap counts the work you do outside chat too.** Finishing a Codework project, running an Organization, holding a Group Chat, running a custom skill, and rendering a Studio video now register in your weekly Wrapped and the dashboard's most-active card, the same way in-chat work already did, so the picture of how you use Skales is no longer chat-only.
- **A cleaner, more human voice.** Replies avoid em-dashes and marketing filler, both in how Skales is guided and in a final pass over the answer.
- **A smaller, faster download on Mac and Linux.** The installer no longer carries build tooling it never runs, so it is meaningfully smaller and updates arrive faster.
- **Background and team work runs leaner.** Unattended tasks, agents and team plans load only the tools a step needs instead of the whole set.
- **The free trial no longer ties itself to usage analytics.** When you start Skales IQ, anonymous usage statistics stay on by default to help improve the product, but onboarding now has a clear switch to turn them off on the spot, and the trial starts either way. Choosing not to share them never blocks or changes your trial.
- **The native, consistent look now reaches the rest of the app.** Settings, Chat, the sidebar and History share the same rounded cards and inputs, snappier motion that only animates what should move, the last raw dropdowns replaced by the same keyboard-friendly menu, and disabled controls that dim again, so the whole app feels of a piece. History's provider and channel filters sit on one tidy row with the refresh beside the conversation count, and the sidebar's bottom bar reads more calmly.
- **The new-chat screen has more to say.** It opens with a wider, rotating set of lines, including a few meant to make you smile, instead of the same handful, and the input keeps a little breathing room when you focus it.
- **Codework asks before writing by default.** New file writes wait for your approval until you say otherwise; turn auto-approve back on in the approval panel whenever you want the faster flow.
- **Full disk access takes a deliberate second step.** The full-disk option in the Code access prompt now says plainly that it applies to every chat and stays on until you change it in Settings, and asks you to confirm once more, so a single tap can no longer open your whole disk everywhere. Granting just the one folder stays one tap and is the recommended choice.
- **Codework follows the same folder-safety rules as the rest of Skales.** It uses the shared protected-paths list and re-checks the real location of a file before writing, so a project that tries to reach outside its own folder through a link is stopped.
- **Codework works to your full step budget, not a fixed limit.** A run now follows your goal step-budget setting all the way (0 means run to completion, like a goal) instead of a hardcoded ceiling, so a real autonomous job is no longer cut short after a handful of steps; a stuck model is still stopped early by the progress guardrails.
- **Codework's autonomy settings moved out of the header and onto the start screen.** You now set auto-approve, file access, preview and the test command before a run, on the start screen, the way a coding agent should. During a run the gear opens those same settings as a clean centered panel that matches the rest of Skales, instead of a strip wedged into the header that could sit on top of a pending approval.
- **Codework's approval looks like the one you know from chat, sits where you are working, and waits for you.** A pending action now shows as the same clear approval card you see in chat, with Approve, Deny and Always approve this session. It is pinned to the bottom over the terminal, not jammed into the header, so the step it is asking about stays readable above it. "Always approve this session" now actually gives the run a free pass, so the rest of the run stops asking instead of prompting again on the next command. And it is patient: the approval waits 30 minutes instead of 5 and a run may take up to an hour, so pausing to read it or opening settings no longer aborts the task with a timeout.
- **Codework reads and searches your files through the same engine as the rest of Skales.** Reading a file and searching the project in a Codework run now go through the shared tool path that Chat uses, so an improvement or fix to it reaches both at once and there is one set of file-safety rules to trust. Writing files, running commands, the file tree, diffs, the write preview and undo are unchanged, and a run still works only inside the folder you chose.
- **Auto pauses before it reaches outside the work.** In Auto mode, an action that pushes to a remote, deploys, runs a destructive command, or writes outside the folder you bound now stops for a single approval instead of going through unattended. Ordinary edits and commands inside the folder still run without asking, so Auto stays fast where it is safe and checks in only where the stakes are higher.
- **Codework shows an accurate diff, and you can open any file to read it.** The change view now lines up moved code correctly instead of marking every line after an inserted one as both removed and added, so a real edit reads cleanly. Clicking a file in the tree opens it in a read-only viewer, so you can check the code on the right without leaving the page. It stays a viewer, not an editor: Codework works by doing, not by hand-editing.
- **A coding chat gets the same project map as Codework.** The structural index of your project now uses the same, larger budget in Chat as in Codework, instead of a tighter chat-only cap, so on a big codebase the model starts with more of the picture. When the map is still too large to fit, it says so and points the model at the rest to open on demand, rather than quietly handing over a partial map.
- **A mistyped file mention tells you, instead of failing quietly.** In a coding chat, when you mention a file with @ that is not in the bound folder, Skales now says it was not attached, so a typo no longer looks like it was simply ignored. A bare word that is not a path, like a skill mention, is left alone.
- **Safe commands stop asking, risky ones get a clearer prompt.** A short list of read-only and test commands, like npm test, git status and listing files, now runs without a confirmation, so a command you repeat all day stops nagging. This skips the prompt only inside a folder-bound coding session (Code, Edits or Auto on a folder you chose); a plain chat still confirms every command. Installing packages or pushing to a remote now asks with a message that says what it does, instead of a blanket "Run command?". A force-push that rewrites remote history, or a download piped straight into a shell, is refused outright with an explanation. The block on system-wrecking commands is unchanged and still cannot be turned off.
- **Commands Skales runs no longer see your secrets.** When Codework or a coding chat runs a shell command, the command now runs with API keys, tokens and Skales' own internal values stripped from its environment, so a script in a project you are working in cannot read them straight out of memory and send them away. The command still runs only in the folder you chose, and new file writes still ask first unless you turn that off.
- **A folder-bound run cannot read outside its folder through a link.** When a coding run reads a file in the folder you chose, it now checks the file's real location, so a link inside the project that points somewhere else can no longer be used to read a file outside the folder. The write side already did this; the read side now matches.
- **Codework reads several files at once.** When Codework decides to read or search more than one file in a single step, it now does that reading in parallel, up to four at a time, instead of one after another, so the part where it gathers context to understand your code is quicker. Writing files, running commands and everything else stay one step at a time, in order. A step that mixes a read with a write or a command runs sequentially too, so a read never returns content from before a write in that same step.
- **Your most-used tools live in the main menu now.** Workflow, Planner, Tasks and Wrapped moved up from Tools into the main sidebar, Discover sits right under History, and Codework moved into Tools, so the surfaces you reach for every day are one click away. The order is the same in every theme, and anything you have switched off in Add-Ons still stays out of the sidebar.
- **Features that have settled no longer wear a Beta tag.** Teams, LLM Profiles, Agent Swarm, the Always-On Agent, Call Mode and memory Dreaming have been steady for a while, so their Beta labels are gone, in every language. The genuinely early ones, like the Skales IQ trial and the Business preview, still say so.
- **The home screen fills in faster.** The dashboard now runs its status checks together instead of one after another, holds the weather and your goal and memory lists for a few seconds, and no longer scans the same files twice on a single open, so it settles quicker without going stale, and a memory you delete still disappears at once.
- **The update screen puts its links last.** The social links now sit at the very bottom of the update page, below the updater's own log, so the log is easier to reach.

### Fixed

- **A connected tool cannot smuggle hidden instructions into Skales.** A tool from an MCP server is third-party, and its description is shown to the model, so a malicious or careless server could hide commands in invisible or control characters inside that text. Skales now strips those characters from every MCP tool description and caps its length, so a connected tool cannot quietly steer the model through text you never see.
- **One misbehaving MCP tool no longer breaks the rest.** A tool that reports a malformed input schema is now coerced to a safe shape instead of breaking the model's tool-calling for the whole message, so a single bad server can no longer take the others down with it.
- **Skales works with MCP servers on the newer protocol.** It now remembers the protocol version a server agrees on and sends it back on every later request, the way the current spec requires, so a stricter or newer server no longer rejects Skales' calls after connecting.
- **The balance card shows a number you can place.** On OpenRouter the home screen now shows only your real remaining credit, without the confusing lifetime-total figure and gauge beside it that did not map to any budget you set.
- **A stopped background engine comes back on its own.** If the Skales server stops while the app is open, for example because its background helper was force-quit (a common way to close Skales on Windows, where shutting the window only hides it to the tray), Skales now quietly restarts it and reloads you right where you were, instead of a red "stopped unexpectedly" box. A calm restart prompt appears only if the engine cannot stay running after several tries.
- **On Windows, selecting Ollama no longer freezes the app or flashes a console window.** If Ollama is not installed Skales says so at once instead of opening a stray window and hanging for ten seconds on every check; when it is installed it starts quietly with no window.
- **A model that got stuck loading its tools now just works.** Some models would keep announcing that a tool is "available next step" instead of using it; Skales now hands those models every tool directly and adds a switch under Settings, Advanced to turn on-demand tool loading off if you ever run into it.
- **The memory page reads cleanly again.** The nightly Dreaming summary and the knowledge-graph line showed a placeholder instead of the real count, and Dreaming could list raw bits of page data as if they were facts. The counts now read normally, only real sentences are kept as memories, and any old stray fragments stop showing.
- **Studio templates fill themselves in.** Picking a template for Skales Studio now opens it with the prompt already in place on the right tab, instead of an empty screen.
- **What you set about yourself stays yours.** The emoji, occupation and goals you enter on the Memory page no longer get overwritten when Skales does its background tidy-up of what it knows about you. The cleanup used to let its model rewrite those user-set fields with its own guesses; now your own answers are kept every time, while a field you left blank stays open for Skales to fill in as it learns. Only the AI summary is meant to update on its own.
- **Plan mode is genuinely read-only.** It used to let a writing connector or an external tool slip through because they were judged only by their name; Plan now reads what the tool would actually do, so a chat set to Plan investigates and proposes but changes nothing until you switch to Code.
- **Codework approvals are steadier.** A pending approval or a proposed change is now also saved to disk so it is easier to keep track of in the background, and a stale internal reference that could send a tool down the wrong path was removed.
- **A long chat that becomes a goal now proves it is finished.** When a long task quietly turns into an autonomous goal, Skales works out what "done" means for it and checks against that before saying it is finished, instead of taking the model's word, so a weaker model can no longer stop a converted task early.
- **Codework re-checks the project folder before it reads anything.** The folder you point Codework at is now validated on the server as well, not only in the window, so a run always works inside a vetted, writable, non-system folder before any file is read.
- **Plan mode catches more external write tools.** A connected tool whose name mixes a read word with a write one, like a "query and delete" tool, is now held back in Plan mode instead of slipping through on the read word, so a read-only investigation stays read-only.
- **Wrapped reports an honest "most-used tool".** Studio, Organization, Playbooks, Templates and MCP activity used to fall into the Chat bucket, which inflated Chat and hid those tools; each is counted on its own now. A busy week is no longer trimmed early either, so the activity total reflects everything you did instead of stopping at an old internal limit.
- **A shell command cannot slip a second action past the safety check.** A safe command that runs without asking in a coding session can no longer carry a riskier one hidden on a new line, and Auto mode now pauses for a single approval on a destructive command however its flags are spaced or spelled, and on a command that writes to a file outside the folder you bound. A force-push that rewrites remote history is still refused unless you have deliberately set safety to Unrestricted.
- **A coding run stays inside its folder when it reads, not only when it writes.** A file reached through a link, or through a path that points up and out of the project, is no longer read from outside the folder you chose, so the read side now matches the protection the write side already had.
- **The commands Skales runs never see your secrets, including the ones it runs for itself.** The internal version, status and search commands now also run with your API keys, tokens and Skales' own values stripped from their environment, and a few more credential shapes (a database URL, a webhook) are recognised and removed.
- **A long chat that becomes a goal finishes in one go again.** A task that quietly turned into a goal at the step cap could get stuck asking you to keep going instead of completing on a clear, finished answer. It now completes unless a real check actually finds something unfinished.
- **Your daily briefing still reaches you when the first look of the day was quiet.** If nothing was waiting at the first morning check, the day stays open so anything that comes up later still arrives in one calm briefing, instead of the slot being spent on an empty one.
- **One reminder for a meeting, not two.** With a check-in style turned on, a meeting about to start no longer pings you twice from two different places.
- **Skales keeps only what you meant to teach it.** A one-off request phrased like an instruction ("from now on, can you...") is no longer stored as a permanent rule, and pinning or deleting a saved lesson on the memory page can no longer collide with the background learning and lose your change.
- **A new chat is never named "No response", and a real title is kept.** A title that happens to begin with "We", "I" or "The" is no longer mistaken for leaked reasoning and dropped, while an empty or thinking-only reply no longer becomes the chat's name.
- **Every most-used surface on the home screen opens its own page.** A row for Codework, Studio, Organization, Playbooks or Templates now opens that surface instead of always opening Chat.
- **Premium replies stay quick across a long session.** Replies from Claude reuse the stable part of the prompt from one turn to the next again, so a long conversation does not slow down as it grows.
- **Role bundles load safely.** An empty or malformed bundle file no longer stops the rest of a bundle from loading, and a connector named with a scope or a symbol is recognised correctly.
- **The dark and light mode control is labelled correctly** again, instead of reading "Appearance".
- **Typing a command in a long message keeps the cursor where you are.** When your draft held a /command or an @mention and grew tall enough to scroll, the box could stop following your cursor and drop your taps in the wrong spot, so you could not fix a word. The box now scrolls with you and the highlighted text lines up with the caret, so a long message edits normally.

