/**
 * THE DESCENT — Game Data
 *
 * All room definitions, items, and prophecy fragments.
 * This is the file you'll spend most of your time in.
 *
 * ROOM SCHEMA:
 * {
 *   id:                  string    — unique room key
 *   name:                string    — display name
 *   zone:                string    — 'cavern', 'forest', 'ruins1', 'ruins2', 'ruins3', 'sleeping'
 *   description:         string    — default room text
 *   descriptionFirst:    string?   — first visit (if different from default)
 *   descriptionReturn:   string?   — subsequent visits
 *   descriptionChanged:  string?   — post-Vreth'kai world variant
 *   exits:               {}?       — direction -> { roomId, label?, requires?, hidden?, blockedText? }
 *   actions:             []?       — room-specific choice actions
 *   items:               []?       — item ids present in room
 *   useItems:            []?       — item-use interactions
 *   textHandlers:        []?       — freeform text input handlers
 *   examineTargets:      {}?       — keyword -> description for "examine X"
 *   prophecy:            {}?       — { id, title, text }
 *   timer:               {}?       — { turns, onExpire, warning, warningOnEnter }
 *   onEnter:             fn?       — custom script on room entry
 *   inputMode:           string?   — 'choices', 'text', 'both', 'none' (default: 'both')
 * }
 *
 * ITEM SCHEMA:
 * {
 *   id:           string
 *   name:         string
 *   description:  string
 * }
 */

const GAME_DATA = {
  config: {
    startRoom: 'the_fall',
    maxInventory: 6,
    title: 'The Descent',
    subtitle: 'A text adventure set in a dying cycle of Aurelon'
  },

  // ═══════════════════════════════════════════
  // ITEMS
  // ═══════════════════════════════════════════

  items: [
    {
      id: 'flint',
      name: 'Flint and Tinder',
      description: 'A small flint stone and a dry strip of cloth. Enough to make a spark, maybe a small flame. Someone left these here on purpose, or dropped them while running.'
    },
    {
      id: 'pry_bar',
      name: 'Iron Pry Bar',
      description: 'A length of bent iron, rusted but solid. One end is flattened to a wedge. It was used for something once. The marks on it suggest haste.'
    },
    {
      id: 'rope',
      name: 'Coil of Rope',
      description: 'Old rope, braided from something that might have been plant fiber once. Still holds when you pull. About twenty feet, coiled tight.'
    },
    {
      id: 'lantern',
      name: 'Clay Lantern',
      description: 'A small clay lamp, the kind made for holding in one hand. Empty of oil but intact. With fuel and flame, it would push back the dark.'
    },
    {
      id: 'bone_knife',
      name: 'Bone Knife',
      description: 'Sharpened from something large. The edge is still keen. Whoever made this knew what they were doing, and did it in a hurry.'
    },
    {
      id: 'seal_stone',
      name: 'Seal Stone',
      description: 'A flat disc of dark stone. Something is carved into both faces, too precise to be decorative. It feels heavier than it should.'
    },
    {
      id: 'relic_shard_forest',
      name: 'Living Shard',
      description: 'A fragment of something that pulses faintly — heartbeat-slow, held in stone. Warm to the touch. The break-edges are too clean. Somewhere larger is missing the piece in your hand.'
    },
    {
      id: 'hollow_reed',
      name: 'Hollow Reed',
      description: 'A length of reed cut clean at both ends. Fibrous, light, smelling faintly of decay. Held to the mouth, it filters what the air is carrying.'
    },
    {
      id: 'decay_token',
      name: 'Black Token',
      description: 'A flat disc of black stone. Cold even when the room is warm. The surface drinks the light around it. Holding it is unpleasant. Putting it down is also unpleasant.'
    },
    {
      id: 'quiet_stone',
      name: 'Quiet Stone',
      description: 'A grey stone, smooth, the size of a closed fist. Heavier than it should be. When you hold it the world goes still around your hand — a small circle of silence travels with it.'
    },
    {
      id: 'lit_lantern',
      name: 'Lit Lantern',
      description: 'The clay lantern, burning. The flame is small and steady. The light it throws is not bright, but it is enough. Things that hate the light step aside without being asked.'
    },
    {
      id: 'spore_filter',
      name: 'Spore Filter',
      description: 'The hollow reed wrapped in a fold of cloth, bound with a strip of bark. Held to the mouth and breathed through, it strips the air of what the air should not be carrying.'
    },
    {
      id: 'fishing_rod',
      name: 'Old Fishing Rod',
      description: `A rod of pale wood, taller than a man. The grip is wrapped in sinew that has been re-wrapped several times. The reel is half-rotten and turns only one way. The hook is hand-shaped, set wrong in the line, set wrong on purpose.

Tied to the grip is a small leather pouch. Inside: a dozen more hooks, all hand-made, all the same shape. Whoever owned this rod came down ready to lose hooks.

Scratched into the butt of the rod: a tally. Five marks. The sixth was started and not finished.`
    }
  ],

  // ═══════════════════════════════════════════
  // FISHING — pool of normal catches and per-room special fish
  // (Used by engine.js cast/wait/pull state machine. The Fisher
  //  ending requires all three special flags to be set, then
  //  any basic_escape route triggers the named ending.)
  // ═══════════════════════════════════════════
  fishing: {
    // Rooms where the rod will respond to `cast`. Each defines a normal
    // pool the room draws from for the first 3 catches, plus the special
    // fish the 4th catch always produces (sets the corresponding flag).
    rooms: {
      dripping_gallery: {
        ambient: 'You crouch at the edge of the pool. The water has been still long enough to have learned stillness.',
        normalCatchesNeeded: 3,
        special: {
          catchId: 'scale',
          name: 'The Scale',
          text: `The line lifts as if pulling against nothing. You pull with it.

A scale comes up. Single. Larger than your hand. Thicker than fish-scale should be. Held to the light, the pattern continues into the scale itself. Not on it. In it.

The scale is warm. It does not stop being warm.

You set it carefully on the stone beside you. You consider whether the fish that lost it is still in the pool. You decide not to fish this water again.`
        }
      },
      weeping_wall: {
        ambient: 'You hold the rod in the thin sheet of water that runs over the carving. The water is too thin for fishing. You wait anyway.',
        normalCatchesNeeded: 3,
        special: {
          catchId: 'sentence',
          name: 'The Sentence',
          text: `The line in this water has nothing to catch. There is nothing here to fish. You wait anyway.

After the third turn the water does what water does not do — it stops. For one moment the carved words beneath the sheet are dry. You read what the water has been hiding.

Then the water resumes.

You are carrying the sentence now. The shape of it has lodged behind your teeth and will not be put down.`
        }
      },
      // The Drowned Way is special: the player is underwater with limited
      // breath, so a single deterministic cast produces the special fish.
      // No normal-catch grinding here — one shot, one catch.
      drowned_way: {
        ambient: 'You hold the rod in slack water. Your breath is held. The current does not pull at the line because the basin has nothing left to be pulled toward.',
        normalCatchesNeeded: 0,
        oneShot: true,
        special: {
          catchId: 'stone',
          name: 'The Stone',
          text: `The line stops moving. The water around it keeps moving. The line is being held.

You pull and what comes up is a stone with a hole bored through it, and through the hole, a length of human hair that is still attached to something below.

You cut the line above the stone. The stone you keep. You do not look at the water again until you are gone.`
        }
      }
    },
    // 12 normal catches. The engine picks one at random per successful pull
    // in a room that hasn't yet hit normalCatchesNeeded. Each entry stands
    // alone — no overlap, no stacking. Voice: deadpan, body-grounded.
    pool: [
      `A blind cavefish. Pale. Transparent enough to see what it has eaten. You release it. It does not swim away immediately — as though it is waiting to be sure you meant it.`,

      `An eyeless trout. Wrong size for the depth. Three times the size it has any right to be. Its skin is loose where the eyes should be. You set it back. The water swallows it without ceremony.`,

      `Something with too many joints. Small. Wrong. The joints bend in directions joints do not bend.

You release it. It does not swim away. It walks.`,

      `A coin. Green with age. Older than the carvings on the wall. The face stamped on it is a face you know.

The face is yours.`,

      `A bone, half-decayed. Small. The teeth marks on it match the teeth in your jaw. You put it back in the water carefully. You do not put it where you found it.`,

      `A page from a book that was never written. Wet, but legible. The handwriting is yours. You do not read what you wrote.`,

      `Hair. A great quantity of it, long and dark, weighted at the end with something you do not pull up far enough to see.

You cut your line above the weight. The hook stays with whatever has it. The pouch on the rod gives up another.`,

      `A child's wooden boat. Perfectly preserved. Inside, in pencil, a name has been written in a child's hand. The name is yours.

You set the boat back in the water carefully. You do not break it.`,

      `A fish that does not move when caught. Not because it is dead. Because it has decided not to. The hook is in its mouth. The fish is patient. After a moment you remove the hook and put the fish back. It stays where you put it.`,

      `Nothing. The hook returns wet and empty. The waiting was the catch.`,

      `A second hook, already used, already abandoned by someone else. The line attached to it is rotted to nothing. You tie the new hook onto your own line above your own hook. The line is heavier now. The line catches no better.`,

      `The water itself, pulled up in a thin sheet that holds its shape long enough for you to see your face in it.

You drop it back. You do not look closely.`
    ],
    // Pulled-too-early prose. The hook returns empty and the rod takes a
    // small fragility hit. Picked at random for variety.
    emptyPulls: [
      `You pull. The hook comes back wet and empty. Whatever was deciding has decided against you.`,
      `The line jerks free. The hook returns. The hook is bare.`,
      `Too soon. The line answers your pull and gives you nothing back.`,
      `The hook surfaces empty. The water has not finished agreeing.`
    ],
    // Lost-bite prose — the player waited too long.
    escaped: [
      `The line goes slack. Whatever was there has left it. You have been patient with the wrong patience.`,
      `The pull at the line stops. The water keeps what it had been about to give.`,
      `The line drifts free again. The bite is gone. You waited longer than the bite was willing to.`
    ],
    // State-transition prose. Picked from the array for that state when the
    // engine emits a wait response. Variants are intentionally subtle —
    // some cues read clearer than others, and a careful reader learns the
    // shape of each state by repetition rather than by keyword-matching.
    states: {
      drifting: [
        `The line drifts. The water has not noticed it.`,
        `The float sits where you left it. Nothing is reading it.`,
        `The line goes nowhere. You wait with it.`,
        `The hook hangs in dark water. The water keeps doing what water does.`,
        `Nothing. The line is line. The water is water.`,
        `The float bobs once with the current and then is still again.`,
        `The line sits in the water. The water has not decided to do anything with it.`
      ],
      brushed: [
        `Something passes near the line. Not interested. Not yet.`,
        `The line trembles once. The water resumes its waiting.`,
        `A weight tests the hook and lets go.`,
        `Something moves at the edge of where the line goes. The float twitches. Then nothing.`,
        `A presence near the hook. It does not commit.`,
        `The line shifts in the water. Something has noticed. Something has not decided.`,
        `The float dips half an inch and rises. Curiosity, not hunger.`
      ],
      tugged: [
        `The line trembles. Then again. Something is deciding.`,
        `The line bends slow. Whatever is on the end of it is heavier than expected.`,
        `The float dips. Then dips again. Pull, or do not pull.`,
        `The line tugs once — a real pull, then nothing. Then a real pull again.`,
        `Something has the hook. The line bends. Whether it stays is up to whatever has it.`,
        `The float goes under. Comes back. Goes under again. The third time it stays under.`,
        `A weight that wasn't there is there now. It is moving the line in slow circles.`
      ],
      set: [
        `The line tightens. Something has agreed. Pull now.`,
        `The line goes taut and stays. You will not get a second moment.`,
        `Set. The line will hold. Pull.`,
        `The line is on. A weight at the end of it that means business.`,
        `The hook is taken. The fish has accepted itself into your hand. Pull.`,
        `Now. The line is yours to land or to lose.`,
        `The float is gone. The line is straight down. Pull.`
      ]
    },
    // Slip prose — the bite was real but the player pulled at the wrong
    // intensity, or got unlucky. Cast clears, no fragility cost. The fish
    // takes the hook with it sometimes; not always.
    slipped: [
      `The line slips. The hook goes with whatever you almost had. The pouch gives up another.`,
      `The hook comes back light. The fish takes the freedom you offered it.`,
      `The line goes loose. Whatever you were about to land has decided not to be landed.`,
      `The pull gives. The fish was stronger than your timing. The water keeps it.`
    ],
    // Fight phase — after a successful pull, the engine emits one of these
    // prompts. The player must respond with `pull` (force the fish in) or
    // `release` (let some line out, gentle the fish to surface). The hint
    // word in each prompt telegraphs the answer to a careful reader.
    //
    // Heuristic: heavy / down / runs / steady / breathing / bows = release.
    //            light / fast / upward / thrashes / jerks / taut = pull.
    //            still / waiting / accepted / easy = pull (calm = forcible).
    fightPrompts: [
      {
        text: `The line is on. The fish dives. Heavy. Downward. The rod bends toward the water.`,
        expected: 'release'
      },
      {
        text: `The line jerks upward, fast and light. The fish is small and angry and rising.`,
        expected: 'pull'
      },
      {
        text: `The line runs sideways. The fish is heading for cover.`,
        expected: 'release'
      },
      {
        text: `The line goes still. The fish has stopped fighting. It is waiting for you.`,
        expected: 'pull'
      },
      {
        text: `The line bows hard. Then bows the other way. The fish is confused. Or you are.`,
        expected: 'release'
      },
      {
        text: `The line jerks once and then lies easy. Whatever is on it has accepted itself.`,
        expected: 'pull'
      },
      {
        text: `The line trembles steady. Heavy. Slow. Something at the other end is breathing into it.`,
        expected: 'release'
      },
      {
        text: `The line snaps taut. Slack. Taut again. The fish is testing the rod.`,
        expected: 'pull'
      },
      {
        text: `The line holds. The fish holds. Neither of you is moving. Whoever moves first wins.`,
        expected: 'pull'
      },
      {
        text: `The fish dives and keeps diving. The reel screams against the going.`,
        expected: 'release'
      }
    ],
    // Wrong-fight-response prose. The fish escapes; cast clears, no fragility.
    fightFail: [
      `Wrong. The line gives where it should have held, or holds where it should have given. The fish is gone.`,
      `The fish takes the chance you gave it. The line comes back light.`,
      `Off. The fish read your hand before you read the line. The water keeps it.`,
      `You misread the bend. The fish slips. The hook returns with nothing on it.`
    ],
    // Rod fragility — starts at 15. Empty pulls cost 2. Successful catches
    // cost 1. Special fish catches cost 0 (the rod doesn't mind those).
    initialFragility: 15,
    breakText: `The rod gives. Not loudly. The wood you have been pulling against this whole time was the wood it always was, and now it is wood that has finished. The line goes with it. The water keeps the rod and the line and the hook and whatever you were about to know.`
  },

  // ═══════════════════════════════════════════
  // NPCs (roaming, conversable)
  // ═══════════════════════════════════════════
  npcs: [
    {
      id: 'guardian',
      name: 'the Guardian',
      // Hidden from NPC tracking until the player reaches the deep zones for the
      // first time. The Guardian roams the Sleeping path and Ruins III.
      patrol: ['bone_cathedral', 'first_word', 'heart_chamber', 'quickening', 'antechamber', 'pulse'],
      moveEvery: 4,
      presenceLine: `A figure stands across the room from you, watching without watching. Tall. Robed. The face is calm — the calm of someone who has worn it long enough that the muscles have forgotten any other shape. They are not from this place but they have been here a long time.`,
      arrivalLine: `Footsteps. Soft. Then the figure steps into the room. Their attention turns toward you without urgency.`,
      departureLine: `The figure moves on. They do not say goodbye.`,
      talkLabel: 'Speak with the Guardian',
      topics: {
        greet: {
          text: `The Guardian inclines their head.

"You found a way down. Few do." Their voice is low. Even. Each word set down like a stone they have already weighed. "I will not stop you. I will not help you, either, beyond what you ask."`,
          unlocks: ['who', 'why_here', 'cycle', 'old_god', 'mappers', 'help_me', 'leave']
        },
        who: {
          prompt: 'Who are you?',
          text: `"A guardian. The kind that watches when watching is the only thing left to do."

They do not name themselves. The not-naming is intentional.`,
          once: true,
          unlocks: ['twelve']
        },
        twelve: {
          prompt: 'There were twelve, weren\'t there?',
          text: `Something in their face changes — only for an instant.

"Twelve stood at the beginning. Twelve stand still. Some watch the wind. Some watch the fire." A pause. "I watch the one who chose to sleep. The cycle is a cage. He is the only one in it who chose."`,
          once: true
        },
        why_here: {
          prompt: 'What are you doing here?',
          text: `"Investigating. He has been quieter, this cycle. Quieter than he should be. The cycle is failing on this world. When the failing reaches him, he will decide to wake or he will decide to keep sleeping. I am here to know which."`,
          once: true
        },
        cycle: {
          prompt: 'What is the cycle?',
          text: `"A cage made of repetition. The fire is held by the lock at the centre, the lock is held by the breaking, the breaking is held by the cycle. Each turn keeps the fire from gathering. Each turn weakens the lock a little more. The cage was always going to fail." A small movement of the shoulders that on another face would be a shrug. "It has lasted longer than the architects expected."`,
          once: true
        },
        old_god: {
          prompt: 'The Sleeping God — who is he?',
          text: `"Not what you think." The Guardian considers the question for longer than they considered any other.

"He was there when the first cycle began. He heard what was spoken. He chose stillness over what the others chose. The architects did not anticipate stillness as a choice. He has been alone with that choice for longer than any of us can hold in our minds."

They do not say more. The not-saying is a kindness.`,
          once: true
        },
        mappers: {
          prompt: 'Who carved the letters above the doors?',
          text: `"People before you. They came down to read. Most did not return. Those that did, did not return whole."

A pause.

"They mapped what they could. They left what they had read where they could leave it. The wall in the cosmogony chamber is the longest message any of them finished writing. Read it. The reading is what they died for."`,
          once: true
        },
        help_me: {
          prompt: 'Will you help me?',
          text: `"No."

The word is given without weight, without apology. They do not elaborate.`,
          once: true,
          unlocks: ['why_not']
        },
        why_not: {
          prompt: 'Why not?',
          text: `"Because what is happening here is yours to do. If I helped you, the help would not be help. The cycle cannot be unmade by someone who came here already knowing how. It can only be unmade by someone who learned, here, what it was."`,
          once: true
        },
        leave: {
          prompt: 'Goodbye.',
          text: `The Guardian inclines their head. "Walk carefully. The dark watches more than it pretends to."`,
          exits: true
        }
      }
    },
    {
      id: 'forest_hunter',
      name: 'the hunter',
      hostile: true,
      // Active only on changed-world runs (after a Vreth'kai-with-Mind ending).
      // First-time players never encounter this. Returning players face new danger.
      activeWhen: function(engine) { return !!engine.isChangedWorld; },
      patrol: ['feeding_ground', 'tangled_path', 'spore_corridor', 'overgrowth', 'fungal_hollow'],
      moveEvery: 2,
      // The forest's offering ritual still works — leaving the bone knife at
      // the Root Shrine teaches the forest to recognise you. A lit lantern
      // also keeps the hunter back: things that hate the dark have a name
      // for the light.
      deterredBy: { hasFlag: 'forest_offered' },
      catchText: `Long. Pale. Wrong in the joints. It came down from the canopy and the canopy did not catch it on the way.

You forget your name. You forget you had one.`,
      deterredText: `Something heavy passes close. The forest agreed not to point it at you. The agreement holds.`,
      nearbyText: `Something heavy moves on the other side of the wall. You hear it not breathe.`,
      // No presenceLine — hostile NPCs don't reveal themselves on entry; they
      // simply kill (if undeterred) or near-miss.
      topics: {} // not conversable
    },
    {
      id: 'wandering_vrethkai',
      name: 'the wandering one',
      // Visible only when the player is themselves Vreth'kai-with-Mind.
      // To ordinary players, this NPC may as well not exist.
      visibleWhen: function(engine) { return !!engine.flags.vrethkai_with_mind; },
      patrol: ['bone_cathedral', 'throat', 'wound_eternal', 'pulse'],
      moveEvery: 3,
      presenceLine: `Something stands at the far edge of the room. Long. Pale. The joints bend at angles your body learned to call wrong before it learned to bend that way too.

It has not eaten you. It is not going to. Its eyes — the dark hollows where eyes belong — track you with the steady, unblinking patience of recognition.`,
      arrivalLine: `It enters without sound. Bone-soft floor takes its weight. Bone-soft floor takes yours.`,
      departureLine: `It moves on into the dark. It does not look back. It does not need to.`,
      talkLabel: 'Speak with it (with the throat you have now)',
      topics: {
        greet: {
          text: `You speak. Or you do something that resembles speaking, in the body you have now.

It answers. The grammar is older than language. The vocabulary is the same vocabulary you heard behind your teeth in the Mycelium Web, but louder, and the loudness is not in your ears.

It is willing to talk. There is much it remembers.`,
          unlocks: ['who_were_you', 'how_to_leave', 'remember', 'where_go', 'others', 'leave']
        },
        who_were_you: {
          prompt: '(ask) — who were you?',
          text: `*A name,* it answers, *I had once. The shape of the name is gone. The reason for the name is not.*

*I came down for a sister. I did not find her. I found something else.*

*I have been the something else for a very long time.*`,
          once: true
        },
        how_to_leave: {
          prompt: '(ask) — how do I leave?',
          text: `*Speak the word the dead mappers carved. The word that the bone of the throat shows you.*

*If you have not yet read the word, read it. The bone will show you. Speak it where the dark holds you and the dark steps aside.*

*If you do not speak it, you will not leave. The breath of the throat counts twenty.*`,
          once: true
        },
        remember: {
          prompt: '(ask) — what do you remember?',
          text: `*Light. I remember light. The grey kind that came from above. I remember a voice that was not mine, calling me by the name the shape of which is gone.*

*I remember someone else. I do not remember whether I followed them or they followed me. We came to the same place by different paths and the place was a mouth.*

*The mouth ate the difference between us first.*`,
          once: true
        },
        where_go: {
          prompt: '(ask) — where do you go?',
          text: `*Where the dark needs me. The dark does not need me much. The cycle is failing. The dark has been quieter, this cycle.*

*Sometimes the throat. Sometimes the cathedral. Once I went up into the forest. The forest did not know what to do with me. I came back.*`,
          once: true
        },
        others: {
          prompt: '(ask) — are there others like us?',
          text: `*Few. Most who are taken do not keep the part that asks. The part that asks is the part the dark wants most. To keep it, you must have spoken the word. Or you must have been already broken in a way the dark could not finish.*

*I was already broken. You spoke the word. We are not the same.*`,
          once: true
        },
        leave: {
          prompt: '(turn away)',
          text: `It does not say goodbye. The grammar it is using does not have a word for that. It simply turns its head, and the conversation ends.`,
          exits: true
        }
      }
    }
  ],

  // ═══════════════════════════════════════════
  // ITEM COMBINATIONS
  // ═══════════════════════════════════════════
  combinations: [
    {
      inputs: ['flint', 'lantern'],
      result: 'lit_lantern',
      text: `You strike the flint into the lantern's wick. The cloth catches. The flame is small and steady.

The dark in your hand has become a small circle of light. The light is yours to carry.`,
      setFlag: { lantern_lit: true }
    },
    {
      inputs: ['hollow_reed', 'bone_knife'],
      result: 'spore_filter',
      text: `You cut a strip of bark from the reed and use the bone edge to wrap and bind it tight. The reed is now wrapped, the wrapping is now functional.

The thing in your hand will not let what should not enter, enter.`,
      setFlag: { spore_filter_active: true }
    }
  ],

  // ═══════════════════════════════════════════
  // ROOMS — THE CAVERN (Rooms 1-10)
  // ═══════════════════════════════════════════

  rooms: [
    // ─── ROOM 1: THE FALL ───
    {
      id: 'the_fall',
      name: 'The Fall',
      zone: 'cavern',
      descriptionFirst: `The world above had been grey for months. You were walking through it because walking through it was what people did, when the alternative was sitting still while the cycle finished failing.

The ground gave way under you. There was a moment of understanding — what was happening, why — and then the dark closed around you faster than the understanding could matter.

You wake against stone. You do not know how long you were not awake. The cold against your cheek tells you first, then the fact that the world is no longer above you, then the fact that you are not injured, which is something that should not be true after a fall like that, and is.

Rubble above you, where the earth opened. A shaft of grey light comes down through the gap, but it is narrowing — dust settling, stones shifting. You will not be climbing back through that.

The air is cool. Damp. It smells like old stone and something else underneath it, something you don't have a word for. The dark begins a few feet in every direction.

You are alone. The world above, the one that was dying, feels very far away already.`,

      description: `The bottom of the fall. Rubble above, darkness below. The shaft of grey light is thinner now. Stones have settled. There is no way back up.`,

      examineTargets: {
        'rubble': 'Broken stone and packed earth. The hole you fell through is already half-closed. Even if you could reach it, the edges are crumbling.',
        'light': 'Grey and fading. The dust in the air catches it. It won\'t last.',
        'dark': 'It begins where the light ends. It is patient.',
        'air': 'Cool and damp. That smell underneath the stone — old. Very old. Like opening a room that has been sealed for a long time.',
        'lintel': 'There is no door, no lintel — just the rubble where the world above used to be. But on the largest stone, scratched in something that bled across the surface: a single letter. **F**. The hand was unsteady. Whoever made the mark made it just before the dark closed around them.'
      },

      hints: [
        'There is something on the ground worth taking before the dark closes around it.',
        'The flint and tinder will matter later, even if you don\'t know how yet. Take it before going further.',
        'Take the flint, then move south into the dark.'
      ],

      exits: {
        south: { roomId: 'the_hollow', label: 'Move deeper into the dark' }
      },

      items: ['flint']
    },

    // ─── ROOM 2: THE DRIPPING GALLERY ───
    {
      id: 'dripping_gallery',
      name: 'Dripping Gallery',
      zone: 'cavern',
      descriptionFirst: `The passage opens into a space you feel more than see. The ceiling is high here. You know this because the dripping sounds come from far above.

Water runs down the walls in thin sheets, catching whatever light you carry and giving it back in fragments. The stone is slick underfoot. Somewhere ahead, the water collects into something larger — a pool, maybe, or a stream moving in the dark.

The sound is steady. Patient. It has been doing this for a very long time.`,

      description: `The gallery of dripping water. Slick walls catch the light. Water collects somewhere ahead. The sound has not changed and never will.`,

      examineTargets: {
        'water': 'Clean. Cold. It runs in thin sheets down walls that have been shaped by it over centuries. The grooves are deep.',
        'walls': 'Smooth where the water runs. Rough where it doesn\'t. Natural stone — nothing carved here.',
        'pool': 'You can hear it more than see it. Water collecting in a depression in the floor. It overflows somewhere, moving further into the dark.',
        'ceiling': 'Too high to see clearly. The dripping comes from up there. How far up, you can\'t tell.',
        'rod': 'A rod of pale wood leans against the rock at the edge of the pool. Someone left it. Someone left it deliberately, propped where the next person to find the pool would see it.',
        'tally': 'Five marks scratched into the butt of the rod. The sixth was started and not finished.',
        'pouch': 'A small leather pouch tied to the grip. Inside it, a dozen hand-made hooks. The previous fisher came down expecting to lose hooks. They were right.',
        'hooks': 'A dozen of them, in the pouch tied to the grip. Each one shaped by the same hand. The line on the rod can be re-tied with one as fast as you can think to do it.',
        'lintel': 'No lintel of stone — but where the passage from the Hollow narrows, scratched into the wall just before the dripping begins, a single letter. **D**.'
      },

      items: ['fishing_rod'],

      exits: {
        east: { roomId: 'the_hollow', label: 'Back to the Hollow' },
        south: { roomId: 'bone_shelf', label: 'Follow the water deeper' }
      },

      actions: [
        {
          id: 'swim_upstream',
          label: 'Tie the rope, hold your breath, swim against the current',
          requires: { hasItem: 'rope' },
          text: `You secure one end of the rope around a stalagmite, the other around your waist. You take three breaths the size of the Hollow itself. Then you go down into the water.

The current is strong. The dark is darker than the cavern was.

You pull yourself upstream.`,
          moveTo: 'drowned_way'
        }
      ]
    },

    // ─── ROOM: THE DROWNED WAY (Water Route — Escape #2) ───
    {
      id: 'drowned_way',
      name: 'The Drowned Way',
      zone: 'cavern',
      descriptionFirst: `Underwater. The dark is total. The rope at your waist is the only thing tethering you to anywhere.

Three currents meet here. Your hand finds the difference between them by feel.

To the right, the strongest pull. Water hammers against your ribs and shoves at your shoulders. It is going somewhere fast.

To the left, the water is bright. Not from light — from something the water has been holding. The pull there is gentler.

Below you, the current eddies. The water is slack, almost still, and your hand finds rocks below that feel climbable.

You have a few breaths.`,

      description: `The drowned way. Three currents meet. You will not have many breaths to choose.`,

      examineTargets: {
        'right': 'The water is moving fast. Something at the other end of it is pulling.',
        'strongest': 'Water that moves came from somewhere it could leave. The pull at your hands is the pull of weather above ground — rain on stone, snowmelt, a river finding its bed.',
        'left': 'Bright water. Not lit — stained. Whatever the stain is, it has been settling here long.',
        'bright': 'Bright water that does not move. Stilled water learns things moving water never has to learn. You do not want what it has learned.',
        'below': 'Slack current. Stilled because the basin has no exit. The rocks below have been smoothed by something. You do not want to ask what.',
        'calm': 'The slack current is slack. The basin has no exit.',
        'rope': 'The rope is taut at your waist. It is your only tether.'
      },

      hints: [
        'Three currents. Only one has somewhere to be.',
        'Water that moves with urgency moves toward the surface. Water that pools has been pooling for a long time.',
        'Take the strongest current — up and to the right. It is the only one that goes anywhere.'
      ],

      actions: [
        {
          id: 'water_strongest',
          label: 'Follow the strongest current — up and to the right',
          text: `You pull yourself into the strongest pull. The water carries you fast. For a moment you cannot tell up from down — and then you taste air at the top of a tunnel that opens onto sky.

You climb out, soaked and shivering, into grey light. The rope trails behind you, still tied to the stalagmite far below.`,
          setFlag: { escape_route: 'water_route' },
          moveTo: 'exit_surface'
        },
        {
          id: 'water_bright',
          label: 'Swim toward the bright water — left',
          text: `You swim toward the bright stillness.

The brightness was wrong. The water has been holding something — minerals, or a memory of light from cycles ago — in a pool with no exit. The current you swam against is now between you and the way you came.

You forget your name. You forget you had one.`,
          death: true
        },
        {
          id: 'water_calm',
          label: 'Drop into the calm water below',
          text: `You let yourself sink into the slack current.

The slack current was slack because the water had nowhere to go. You sink between rocks that have been smoothed by drowned things into shapes you do not want to identify.

You forget your name. You forget you had one.`,
          death: true
        }
      ]
    },

    // ─── ROOM 3: THE HOLLOW ───
    {
      id: 'the_hollow',
      name: 'The Hollow',
      zone: 'cavern',
      descriptionFirst: `The passages converge here into a space that feels almost deliberate, as if the stone made room for something. The ceiling domes above you. Four openings lead out in different directions, each one a different shade of dark.

The floor is flat — not perfectly, but enough to notice. Your feet find purchase here in a way they haven't since the fall. You could stop here. Catch your breath. Decide.

There is a faint current of air from the east. Warmer air rises from below.`,

      description: `The Hollow. Four passages branch out from this domed space. The floor is flat enough to stand comfortably. Air moves from the east. Warmth rises from below.`,

      examineTargets: {
        'floor': 'Flat. Almost too flat. Natural, you think. But you\'re not certain.',
        'ceiling': 'Domed. Smooth. The stone curves overhead like the inside of a skull.',
        'air': 'A current from the east, carrying something that smells faintly of outside. Warmth from below, carrying something that smells of nothing at all.',
        'lintel': 'Above each of the four passages, scratched into the stone, the same single letter. **H**. Whoever marked the four entries marked them all the same. Either the room was a hub or the mapper had not yet decided how to distinguish it.'
      },

      hints: [
        'Four passages, but a flat floor in stone like this is rarely just flat.',
        'The floor has been shaped. Not by water. Examine it.',
        'Examine the floor — there is a seam in it that breathes warm air upward.'
      ],

      exits: {
        north: { roomId: 'the_fall', label: 'Back to the Fall' },
        west: { roomId: 'dripping_gallery', label: 'The dripping sound (west)' },
        east: { roomId: 'collapsed_tunnel', label: 'Follow the air current (east)' },
        south: { roomId: 'the_etching', label: 'Descend toward the warmth' },
        down: {
          roomId: 'crack_in_stone',
          label: 'A narrow crack in the floor',
          hidden: true,
          blockedText: null
        }
      },

      // The crack is discovered by examining the floor carefully
      textHandlers: [
        {
          id: 'find_crack',
          patterns: ['examine floor', 'look at floor', 'search floor', 'look down'],
          text: 'You kneel. The flat floor has a seam running through it — not a crack from settling, but a gap. Intentional. Wide enough to fit through if you squeeze. Warm air breathes up from it, steady and slow, like something exhaling.',
          type: 'narration',
          setFlag: { discovered_crack_in_stone: true }
        }
      ]
    },

    // ─── ROOM 4: COLLAPSED TUNNEL ───
    {
      id: 'collapsed_tunnel',
      name: 'Collapsed Tunnel',
      zone: 'cavern',
      descriptionFirst: `The passage east opens into what was once a wider corridor. Was. The ceiling has come down here, filling the way forward with broken stone and compressed earth. Whatever was beyond is buried.

But the air still moves. You can feel it threading through the gaps between stones, carrying that faint scent of outside. There is a way through this. Not for your body — not yet — but the air knows the path.

A heavy slab leans against the collapse at an angle. With the right tool, you might lever it aside and open a gap large enough to crawl through.`,

      description: `The collapsed tunnel. Rubble blocks the way east, but air moves through the gaps. A heavy slab could be levered aside with the right tool.`,

      examineTargets: {
        'rubble': 'Stone and earth, packed tight. The collapse wasn\'t recent — this has been sealed for a long time. But the air still finds a way through.',
        'slab': 'Heavy. Leaning at an angle against the collapse. The bottom edge has a gap beneath it. A good lever could shift it.',
        'air': 'Moving east to west. Steady. It smells faintly of rain, of grass, of a world that still exists above you.'
      },

      hints: [
        'The rubble looks immovable. The slab leaning against it does not.',
        'The right tool would lever the slab free. Iron, perhaps.',
        'Use the iron pry bar on the slab to clear the way east — that path leads to the surface.'
      ],

      exits: {
        west: { roomId: 'the_hollow', label: 'Back to the Hollow' }
      },

      useItems: [
        {
          itemId: 'pry_bar',
          label: 'Lever the slab with the pry bar',
          text: `You wedge the iron bar beneath the slab and lean into it. For a moment nothing moves. Then the stone shifts with a grinding sound that echoes down every passage, and a gap opens — narrow but passable.

Beyond it, the tunnel continues upward. The air is stronger here. Cooler. You can almost taste the sky.`,
          consumeItem: false,
          revealExit: 'rubble_stair',
          revealText: 'The way east is open.',
          setFlag: { tunnel_cleared: true }
        }
      ],

      // After clearing, add the exit
      actions: [
        {
          id: 'go_through',
          label: 'Crawl through the gap (east)',
          requires: { hasFlag: 'tunnel_cleared' },
          moveTo: 'rubble_stair'
        }
      ]
    },

    // ─── ROOM 5: BONE SHELF ───
    {
      id: 'bone_shelf',
      name: 'Bone Shelf',
      zone: 'cavern',
      descriptionFirst: `The passage narrows and then opens onto a natural ledge — a shelf of stone jutting out over a deeper darkness below. Bones here. Old ones. Scattered across the shelf as if something carried them here to eat and then left the remains.

Not animal bones. You know this because you can see a jaw, and jaws like that belong to people.

There is a pack here too, half-rotted. Canvas or leather once, now mostly gone. Whatever was inside has scattered or decayed, but a few things survived the years.`,

      description: `The bone shelf. Old remains scattered on a stone ledge. A rotted pack with a few surviving items.`,

      examineTargets: {
        'bones': 'Old. Very old. The marrow has long since dried to dust. Whoever this was, they died here a long time ago. The teeth in the jaw are worn smooth.',
        'pack': 'Canvas, mostly rotted through. The buckles are green with corrosion. A few things inside survived: iron and bone, the materials that outlast everything else.',
        'jaw': 'Human. The teeth are worn flat at the molars — chewing wear, not violence. They were old when they died down here. They had been down here long enough to grow old.',
        'ledge': 'Natural stone. Below the ledge, the dark continues. You can\'t see the bottom.',
        'lintel': 'On the rock face above where the passage opens onto the shelf, scratched in haste: a single letter. **B**. The person who scratched it might have been the person whose jaw lies here.'
      },

      hints: [
        'Whoever died here left behind more than bones.',
        'Examining the rotted pack will turn up tools the body no longer needs.',
        'Take the iron pry bar and the bone knife. Both will matter.'
      ],

      exits: {
        north: { roomId: 'dripping_gallery', label: 'Back to the gallery' },
        south: { roomId: 'mushroom_grotto', label: 'Climb down past the ledge' },
        down: { roomId: 'overgrowth', label: 'Drop further past the ledge into something green' },
        up: {
          roomId: 'bone_shaft',
          label: 'Climb behind the curtain of bones',
          requires: { hasItem: 'rope' },
          blockedText: 'There is something behind the curtain of bones above the shelf. A shaft, going up. Without rope, the climb would not be a climb — it would be a fall.'
        }
      },

      items: ['pry_bar', 'bone_knife', 'rope']
    },

    // ─── ROOM: THE BONE SHAFT (Bone Climb — Escape #3) ───
    {
      id: 'bone_shaft',
      name: 'The Bone Shaft',
      zone: 'cavern',
      descriptionFirst: `Behind the curtain of bones, the rock opens into a vertical shaft.

The walls are riddled with bone — fused, half-swallowed, the rock grown around them. Some are still articulated. Most are not.

The shaft goes up. You can see grey light filtering down from very far above.

Partway up, the shaft branches. A wider channel curves left. A narrower channel goes straight up.

You secure the rope and begin to climb.`,

      description: `The bone shaft. Calcified ribs lining the climb. The branch above forks into a wider channel that curves left and a narrower channel that continues straight.`,

      examineTargets: {
        'shaft': 'A vertical climb, sixty feet at least. Bones in the walls. The branch above is the only choice.',
        'wider': 'The wider channel curves left. The bones around its mouth are smoothed and weathered — eaten down by passage of air, of water, of bodies. Whatever moved through this channel did not come back the same.',
        'narrower': 'The narrower channel goes straight up. The bones around its mouth are denser, fresher. Things have used this path more recently. They did not always emerge.',
        'bones': 'Calcified into the walls. Around the wider channel: weathered, eaten down. Around the narrower channel: dense, recent. Whatever uses the narrower path uses it often. Whatever used the wider path has been gone for a long time.',
        'rope': 'Tight against your waist. It will hold for the climb.',
        'light': 'Grey. Far above. Filtering down through the wider channel only.'
      },

      hints: [
        'The branch matters. One channel has been weathered by time. The other has been used recently.',
        'Old paths are old because the things that used them are gone. Recent paths are recent because the things that use them are still there.',
        'Take the wider channel, left. The narrower channel is the throat of something that still eats here.'
      ],

      actions: [
        {
          id: 'climb_wider',
          label: 'Take the wider channel, left',
          text: `You pull yourself up into the wider channel. The bones thin out near the top. The rope holds.

You emerge into grey wind, on a hillside the cavern below has not seen in centuries.`,
          setFlag: { escape_route: 'bone_climb' },
          moveTo: 'exit_surface'
        },
        {
          id: 'climb_narrower',
          label: 'Take the narrower channel, straight up',
          text: `You take the narrower passage.

It narrows further. The bones around you grow denser, closer, until the channel is more bone than stone. By the time you understand what you have crawled into, the channel is the inside of something. The inside is not the outside of anything.

You forget your name. You forget you had one.`,
          death: true
        }
      ],

      exits: {
        down: { roomId: 'bone_shelf', label: 'Climb back down to the shelf' }
      }
    },

    // ─── ROOM 6: THE ETCHING ───
    {
      id: 'the_etching',
      name: 'The Etching',
      zone: 'cavern',
      descriptionFirst: `The passage descends and the walls close in. Your shoulders brush stone on both sides. Then the passage opens just enough for a small chamber, barely larger than a closet.

Someone was here.

On the wall, scratched into the stone with something sharp — a finger, maybe, or the point of a bone — are marks. Not random. Deliberate. Letters, if you can call them that, in a hand that shook while writing them.

You lean closer. The marks are deep. Whoever made them pressed hard. They wanted this to last.`,

      description: `The small chamber with the etching. Deep scratches in the stone. Someone was here before you, and they left a message.`,

      examineTargets: {
        'marks': 'Deep grooves in soft stone. The hand that made them trembled but did not stop.',
        'wall': 'The rest of the walls are bare. Only this section was written on. As if this was the only thing worth saying.',
        'chamber': 'Small. Barely room to stand. The kind of place you\'d hide in, or be trapped in.',
        'lintel': 'At the entry, in a hand newer than the etched message inside: a single letter. **E**.'
      },

      prophecy: {
        id: 'P1',
        title: 'The Pieces Reach',
        text: `Each piece remembers.
Each piece reaches for the others across the dark,
calling,
calling,
and the walls hold,
and the hand set them to turning
so the pieces could never be still long enough to mend.`
      },

      exits: {
        north: { roomId: 'the_hollow', label: 'Back to the Hollow' },
        south: { roomId: 'the_seep', label: 'Continue deeper' },
        east: { roomId: 'weeping_wall', label: 'A narrow side passage' }
      }
    },

    // ─── ROOM 7: THE SEEP ───
    {
      id: 'the_seep',
      name: 'The Seep',
      zone: 'cavern',
      descriptionFirst: `The stone here is wet, but not from the water above. The walls themselves bead and run — thick droplets, slightly warm, slow to drip. The air is thicker. Warmer. Wrong.

There are marks on the floor. Not writing this time. Gouges. Long parallel lines dragged through the soft stone, as if something heavy was pulled through here. Or dragged itself.

The gouges are fresh. The edges haven't smoothed.

Your skin tightens between your shoulder blades. You should not stay here long.`,

      description: `The Seep. Wet walls, thick air. Fresh gouges in the floor. Something was here recently. Do not linger.`,

      examineTargets: {
        'gouges': 'Four parallel lines. Deep. The spacing is wrong for any tool you know. They were made by something with fingers, but fingers that ended differently than yours.',
        'walls': 'Wet. The moisture beads and runs. It\'s not water — thicker, slightly warm. You don\'t want to touch it.',
        'air': 'Thick. Sweet in a way that makes your stomach turn. The warmth isn\'t comforting. It\'s the warmth of something alive.',
        'lintel': 'Above the entry from the etching, a single letter has been scratched in. **P**. The mark stops abruptly — whoever began the next stroke had to stop and run.'
      },

      vrethkaiTargets: {
        'walls': 'The wet on the walls is not moisture. It is the script the dead mappers wrote in the only ink they had left. The script reads, plainly, the same word that opens every gate of this place: WITNESS. And below it, smaller, in a hand you recognise as belonging to someone who became what you have become: four turns. The dark counts them. You can count them too.',
        'gouges': 'The four parallel lines are not random. Four turns. Four breaths. They are the same hand, the same patience, the same warning the room has been giving since the first cycle.',
        'script': 'The wet on the walls. WITNESS — and four marks below it.',
        'count': 'Four turns from the moment a body enters. The wall has been telling the truth. You did not have eyes to see it before.'
      },

      timer: {
        turns: 4,
        onExpire: 'death',
        warningOnEnter: 'Something in the air shifts. You feel watched.',
        warning: 'The gouges on the floor seem fresher than they did a moment ago. The air is changing. Move.',
        warningAt: 2,
        bypassItem: 'quiet_stone',
        deathText: `You stayed too long.

The sound came from behind you first — a wet sliding, like something heavy dragging itself across slick stone. Then from the sides. Then from everywhere.

You didn't see what it was. That was a mercy.

You forget your name. You forget you had one.`
      },

      exits: {
        north: { roomId: 'the_etching', label: 'Back (quickly)' },
        south: { roomId: 'echoing_pit', label: 'Through the seep (deeper)' }
      }
    },

    // ─── ROOM 8: WEEPING WALL ───
    {
      id: 'weeping_wall',
      name: 'The Weeping Wall',
      zone: 'cavern',
      descriptionFirst: `A side passage, barely wide enough to walk, opens into an alcove where the wall weeps.

Not water — though there is water here too, running in a thin sheet down the stone. Beneath the water, carved into the wall with careful hands, is a passage of text. The water flows over it, filling the grooves, making the words shimmer and shift as if the stone itself is trying to speak.

The carving is older than the etching you found before. Much older. The style is different — controlled, precise, the work of someone who had time and purpose. This was not scratched in desperation. This was placed here to be found.`,

      description: `The weeping wall. Water runs over carved text, making the words shimmer. An old inscription, placed here with purpose.`,

      examineTargets: {
        'water': 'Thin and clear, running in a sheet over the carved text. It fills the grooves and makes them glow faintly. The source is somewhere above, hidden in a crack too small to see.',
        'carving': 'Precise. Deep. The hand that made this did not shake. The letters are in a script you can mostly read — similar to yours, but older. Some words have shifted meaning.',
        'lintel': 'Above the entryway, scratched into the stone of the lintel: a single letter. **W**. The mark is shallow, recent compared to the carving inside. Someone was mapping this place.',
        'door': 'Above the entryway, scratched into the stone of the lintel: a single letter. **W**. The mark is shallow, recent compared to the carving inside.'
      },

      prophecy: {
        id: 'P2',
        title: 'What Grew Inside',
        text: `What grew inside the walls grew without knowing why.
It built. It loved. It named the stars it couldn't reach.
The stars were not stars.
The names were not true.
But what else do you call the light
when the light is all you have.`
      },

      exits: {
        west: { roomId: 'the_etching', label: 'Back to the etching' }
      }
    },

    // ─── ROOM 9: RUBBLE STAIR ───
    {
      id: 'rubble_stair',
      name: 'Rubble Stair',
      zone: 'cavern',
      descriptionFirst: `Beyond the cleared collapse, the tunnel angles upward. Sharply. The floor becomes a series of broken ledges — not stairs exactly, but close enough. Someone or something climbed this way before, often enough to wear the edges smooth.

The air is noticeably cooler. The smell of stone gives way to something you almost forgot existed: soil. Living soil. Roots thread through cracks above you, thin and pale from the dark but alive.

The sky is up there. You can feel it.`,

      description: `The rubble stair. Broken ledges angling upward. Cool air, pale roots, the smell of soil. The surface is close.`,

      examineTargets: {
        'roots': 'Pale and thin but alive. They\'ve found their way down through cracks in the stone. Wherever they come from, there is soil and rain and light.',
        'ledges': 'Worn smooth by use. Not recent use — old, repeated passage. Something used this path for a long time.',
        'air': 'Cool. Clean. It tastes like the world you fell from.',
        'lintel': 'On the stone at the bottom of the climb, scratched after the earth opened: a single letter. **R**. The mark is bright. Whoever made it left the same way you are about to leave.'
      },

      exits: {
        west: { roomId: 'collapsed_tunnel', label: 'Back down' },
        up: { roomId: 'exit_surface', label: 'Climb toward the light' }
      }
    },

    // ─── ROOM 10: EXIT (Surface) ───
    {
      id: 'exit_surface',
      name: 'The Surface',
      zone: 'cavern',
      // Route-aware: all surface prose lives in onEnter. description left empty so
      // the engine doesn't print a generic line before the route-specific arrival.
      description: '',
      descriptionFirst: '',

      onEnter: function(engine) {
        const route = engine.flags.escape_route || 'rubble_stair';
        const fragments = engine.prophecyFragments.size;
        const shards = engine.relicShards.size;

        // ─── VRETH'KAI WITH MIND — ending takes priority over normal escape logic ───
        if (engine.flags.vrethkai_with_mind) {
          const arrivalV = `You step out of whatever the world had become into whatever the world is.

The grass is grey. The sky is grey. None of it has changed. All of it has changed. The colours of things are not colours anymore but the things colours used to mean. You see them. You see what they were always for.

Down the slope, a town sits in a valley by a river. Smoke rises from the chimneys. Someone is alive there.

The thing that was you walks down toward the smoke.`;
          const epilogueV = `\n\n— THE TURNING (with mind) —\n(You have earned the right to name the small Vreth'kai watching at the end of *Of Echoes and Iron* — the second book of *The Breaking*. A creature the characters do not understand. Something following them, observing, maybe protecting. The player knows what it is. The characters do not. Yet.)`;
          engine._emit('output', arrivalV, 'narration');
          engine._emit('output', epilogueV, 'narration');
          engine.escape('vrethkai_with_mind', '');
          return;
        }

        const ending = engine.checkEndings();

        // ─── Route-specific emergence prose ───
        let arrival = '';
        if (route === 'rubble_stair') {
          arrival = `You pull yourself up through the last gap and the sky hits you like something physical.

Grey. The sky has been grey for months now. The light is thin and cold. After the dark below, it is almost too much.

You are on a hillside. Below you, the treeline. Above you, open ground rolling toward a ridge. The wind moves the grass in waves. No birds. No insects. No far-off dogs. Just wind and grass.

You made it out.`;
        } else if (route === 'canopy') {
          arrival = `The wind finds you first. Then the grass.

You stand in the open after weeks below. Grey sky. Thin light. The forest is somewhere under your feet now and does not feel like it was real.

It was real.`;
        } else if (route === 'root_tunnel') {
          arrival = `The roots close behind you and the sound of the closing is the sound of a door agreeing.

You stand in the wilds. The ridge to the north. The dying grass moving in the wind. Everything is quieter than the world should be. Everything is still here.

You made it out.`;
        } else {
          arrival = `You are above ground. The sky is grey. The wind is moving. You made it out.`;
        }

        engine._emit('output', arrival, 'narration');

        // ─── Ending epilogue ───
        let endText = '';
        if (ending === 'warden') {
          if (route === 'root_tunnel') {
            endText = `\n\nThe forest has closed the wound. The seal holds. Nothing will follow you out. You made certain of that.\n\nYou stand at the edge of the wilds and watch the place where the entrance was. Someone will need to keep watching.\n\n— THE WARDEN OF THE GATE —\n(You have earned the right to name a town guard captain in *Aurelon: The Crosslands*.)`;
          } else if (route === 'canopy') {
            endText = `\n\nThe canopy folds in on itself somewhere far below your feet. The way you came is no longer a way. The seal holds.\n\nYou stand at the edge of the wilds and watch the place where the entrance was. Someone will need to keep watching.\n\n— THE WARDEN OF THE GATE —\n(You have earned the right to name a town guard captain in *Aurelon: The Crosslands*.)`;
          } else {
            endText = `\n\nBehind you, the ground shudders. The entrance collapses — not falling, but folding. The seal holds.\n\nNothing will follow you out. You made certain of that.\n\nYou stand at the edge of the wilds and watch the place where the entrance was. Someone will need to keep watching.\n\n— THE WARDEN OF THE GATE —\n(You have earned the right to name a town guard captain in *Aurelon: The Crosslands*.)`;
          }
          engine.escape('warden', endText);
        } else if (ending === 'fisher') {
          endText = `\n\nYou came up holding three things you did not have when you went down. A scale, larger than your hand. A stone with a hole bored through it. The shape of a sentence you read once when the water stopped running.\n\nThe world above did not change. The wind moves the grass. The sky is grey. None of this is different from when you fell.\n\nBut you came back with what you came back with. What you did has a name. That name has not been written yet.\n\n— THE FISHER —\n(You have earned the right to name a fisher NPC in *The Breaking*. Someone hard people speak of quietly — the one you would want at your side when the world ends slowly.)`;
          engine.escape('fisher', endText);
        } else {
          endText = `\n\nYou stand in the grey light and breathe. The wind moves the grass. The world is still dying. You are still in it.\n\nYou found ${fragments} of 20 prophecy fragments. You carry ${shards} of 3 relic shards.\n\nThe dark is behind you. For now.`;
          engine.escape('basic_escape', endText);
        }
      },

      inputMode: 'none'
    },

    // ─── ROOM: MUSHROOM GROTTO ───
    {
      id: 'mushroom_grotto',
      name: 'Mushroom Grotto',
      zone: 'cavern',
      descriptionFirst: `Below the bone shelf, the stone gives way to soil — actual soil, dark and damp. And growing from it, in clusters that glow faintly blue in the dark, mushrooms.

Dozens of them. Some small as a fingernail, some large as your fist. The blue light they give off is barely enough to see by, but after the absolute dark, it feels like a lantern.

Two kinds grow here. The blue ones, clustered near the walls. And darker ones, almost black, growing in a ring near the center of the grotto. The black ones don't glow. They smell like meat.`,

      description: `The mushroom grotto. Blue glowing fungi near the walls. Black fungi in a ring at the center, smelling of meat. Soft soil underfoot.`,

      examineTargets: {
        'blue mushrooms': 'Faintly luminescent. The caps are smooth and cool. They smell earthy and clean. You\'ve seen similar species on the surface — not these exactly, but relatives. Those were safe to eat.',
        'black mushrooms': 'No glow. The caps are slick and dark. The smell is wrong — meaty, sweet, like something decaying. The ring they form is almost perfect. Too perfect.',
        'soil': 'Dark and rich. It shouldn\'t exist this far underground. Something is feeding it. The mushrooms, maybe. Or something feeding the mushrooms.'
      },

      actions: [
        {
          id: 'eat_blue',
          label: 'Eat a blue mushroom',
          text: 'You pull one free and eat it. Earthy. Cool. Your stomach, empty since the fall, stops complaining. The faint nausea you hadn\'t noticed clears. You feel steadier.',
          once: true,
          setFlag: { fed: true }
        },
        {
          id: 'eat_black',
          label: 'Eat a black mushroom',
          text: `You pull one of the dark caps free. It comes away from the soil with a sound like skin separating from skin.

The taste is sweet. Then it is nothing. Then the grotto tilts sideways and the blue lights streak and blur and your knees find the soil before you know you're falling.

The last thing you see is the ring of black mushrooms, and you could swear they're leaning toward you.`,
          death: true,
          deathText: 'You forget your name. You forget you had one.'
        }
      ],

      exits: {
        north: { roomId: 'bone_shelf', label: 'Back up to the bone shelf' },
        east: { roomId: 'echoing_pit', label: 'Continue into the dark' }
      }
    },

    // ─── ROOM: ECHOING PIT ───
    {
      id: 'echoing_pit',
      name: 'Echoing Pit',
      zone: 'cavern',
      descriptionFirst: `The passage opens onto the edge of something vast.

A pit. The floor drops away into blackness so complete that dropping a stone produces no sound for a long time, and when the sound finally comes it is small and very far below.

The ledge you stand on wraps around the near side of the pit. Narrow but walkable. Across the gap, you can see the faint outline of another passage — but the pit is too wide to jump and there is nothing to bridge it.

A clay lamp sits on the ledge near the edge, abandoned. Empty of oil, but intact.`,

      description: `The echoing pit. A vast drop into darkness. The ledge wraps around the near side. A passage is visible across the gap. A clay lantern sits on the ledge.`,

      examineTargets: {
        'pit': 'Deep. The kind of deep that makes your body lean back from the edge without being told to. The air rising from it is warm and carries no sound.',
        'ledge': 'Narrow. A foot and a half wide at most. The stone is solid but there is no railing, no handhold. Just the edge and the dark.',
        'passage': 'Across the pit. You can see its outline — an archway, maybe, though the style is different from anything natural. You can\'t reach it from here.',
        'lamp': 'Clay. Well-made. Whoever carried this came from a place that made things carefully. It has no oil but no cracks either.'
      },

      items: ['lantern'],

      exits: {
        west: { roomId: 'mushroom_grotto', label: 'Back to the grotto' },
        north: { roomId: 'the_seep', label: 'Back through the seep (dangerous)' }
      },

      // Rope can bridge the gap (future connection to deeper areas)
      useItems: [
        {
          itemId: 'rope',
          label: 'Secure the rope across the pit',
          text: `You find an outcrop of stone on the near side, solid enough. The throw takes three tries — the far side has nothing obvious to catch on. But on the third throw the rope snags on something in the dark across the gap and holds when you pull.

It's not a bridge. It's barely a handhold. But it spans the pit, and if you're willing to trust old rope and the grip of your hands, you can cross.`,
          consumeItem: false,
          setFlag: { pit_bridged: true },
          revealExit: 'crack_in_stone',
          revealText: 'A way across the pit. It leads to a narrow crack in the far wall.'
        }
      ],

      actions: [
        {
          id: 'cross_pit',
          label: 'Cross the pit on the rope',
          requires: { hasFlag: 'pit_bridged' },
          moveTo: 'crack_in_stone'
        }
      ]
    },

    // ─── ROOM: CRACK IN STONE ───
    {
      id: 'crack_in_stone',
      name: 'Crack in the Stone',
      zone: 'cavern',
      descriptionFirst: `Through the gap, past the pit, the stone changes.

The natural cave gives way to something else. The walls here are smoother. Not carved — or if carved, done so long ago that the edges have worn to curves. But the proportions are wrong for nature. The angles are too regular. The passage is too straight.

Warm air rises from below, steady as breath. The smell changes too — less stone, more... dust. Old dust. The kind that settles in places that have been empty for a very long time.

Something was built down here. Or something was always here, and the cave grew around it.`,

      description: `The crack in the stone. Beyond it, the cave becomes something else — smoother walls, regular angles, warm air rising from below. Something was built here.`,

      examineTargets: {
        'walls': 'Smooth. The tooling marks — if there were any — have been worn away by time. But the surfaces are too flat, the corners too consistent. This is architecture, not geology.',
        'air': 'Warm. Rising. It carries the smell of old dust and something underneath the dust that you can\'t name.',
        'dust': 'Fine. Grey. It covers everything in a thin layer. No footprints but yours. No one has been here in a very long time.'
      },

      exits: {
        north: { roomId: 'echoing_pit', label: 'Back across the pit' },
        up: {
          roomId: 'the_hollow',
          label: 'Up through the crack to the Hollow',
          requires: { hasFlag: 'discovered_crack_in_stone' }
        },
        down: { roomId: 'threshold_hall', label: 'Descend into the ruins' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — THE DEEP FOREST (Rooms 11-22)
    // Bioluminescent underground forest. Alive. Aware.
    // ═══════════════════════════════════════════

    // ─── ROOM 11: OVERGROWTH ───
    {
      id: 'overgrowth',
      name: 'Overgrowth',
      zone: 'forest',
      descriptionFirst: `The drop from the bone shelf is longer than it looked.

You land in soil. Soft. Loamy. The sort of earth that has no business being this far below anything.

The dark is no longer absolute. A pale blue-green light filters through everything, settling on the moss, on the threads strung between roots, on the edges of leaves you cannot quite see in full. Nothing here is bright. Nothing is failing either.

Above you the cavern ceiling is lost in a tangle of branches that have never seen the sun. Something moves in the distance. Slow. Deliberate. The forest noticed when you arrived. It has not yet decided what you are.`,

      description: `The Overgrowth. Soft soil. Pale light from things that grow. The forest has noticed you.`,

      examineTargets: {
        'light': 'It comes from the moss, the threads, the edges of leaves. None of it bright. None of it failing.',
        'soil': 'Black. Damp. Something has been feeding it for a very long time.',
        'roots': 'Old beyond reckoning. They reach down through the ceiling above and continue past you, searching.',
        'forest': 'It is aware of you. The awareness is patient.',
        'branches': 'They knit together overhead. No sun has touched them. They reach for something else.',
        'lintel': 'On the bone of an old root that arches into a kind of doorway, a letter has been scratched, then re-scratched as the wood grew over the cut. **O**. The wood disagreed with the cut and lost.'
      },

      exits: {
        up: { roomId: 'bone_shelf', label: 'Climb back to the bone shelf' },
        south: { roomId: 'spore_corridor', label: 'Into the deeper green' },
        east: { roomId: 'tangled_path', label: 'A path between roots' }
      }
    },

    // ─── ROOM 12: SPORE CORRIDOR ───
    {
      id: 'spore_corridor',
      name: 'Spore Corridor',
      zone: 'forest',
      descriptionFirst: `The passage narrows and the air thickens.

Spores drift in slow constellations through the corridor. Some glow. Some do not. They settle on your sleeves, on the back of your hand, on your face, and stay. The walls are not stone here but packed soil shot through with mycelium. Where the spores have fed it, the mycelium glows.

You walk through clouds that part for you and close behind. By the time you reach the far end your sleeves are speckled with light. You will glow for hours.`,

      description: `The spore corridor. Air alive with drifting spores. You leave it dusted in pale light.`,

      examineTargets: {
        'spores': 'Some bright, some dark. They settle and stay. Brushing them off does nothing.',
        'walls': 'Soil and mycelium. The mycelium glows where the spores have touched it.',
        'mycelium': 'Threads finer than hair, layered into a single living surface. Pulsing slow.',
        'sleeves': 'Speckled with light now. Yours and not yours.',
        'lintel': 'Where the corridor begins, in the soil that has hardened to a kind of stone, a letter has been pressed by a finger long since gone. **A**.'
      },

      items: ['hollow_reed'],

      exits: {
        north: { roomId: 'overgrowth', label: 'Back to the Overgrowth' },
        south: { roomId: 'fungal_hollow', label: 'Deeper, where the fungus thickens' },
        east: { roomId: 'tangled_path', label: 'East to the tangled path' }
      }
    },

    // ─── ROOM 13: TANGLED PATH ───
    {
      id: 'tangled_path',
      name: 'Tangled Path',
      zone: 'forest',
      descriptionFirst: `Roots cross the path in such density you must duck, climb, weave through them.

Some grip your ankle when you pass and let go a moment later. Testing.

The path bends. It bends again. After a while you cannot say whether you are descending or rising. You can say only that you are still moving.

Whatever wore this path did not wear it on two legs.`,

      description: `The tangled path. Roots that test you. Direction that refuses to commit.`,

      examineTargets: {
        'roots': 'Thick as your wrist where they cross the path. Thinner where they don\'t. They have learned the shape of passage.',
        'path': 'Worn smooth in places. Recent passage. Not human.',
        'ankle': 'Where the root touched it, the skin is faintly cool. The cool fades after a few breaths.',
        'lintel': 'On the largest root that arches across the path, a letter has been carved by knife. **G**. The wood has tried to close the cut three times. The cut has won three times.'
      },

      exits: {
        west: { roomId: 'overgrowth', label: 'Back to the Overgrowth' },
        north: { roomId: 'root_shrine', label: 'Into a constructed-looking alcove' },
        south: { roomId: 'crystal_grove', label: 'Toward something that catches light' }
      }
    },

    // ─── ROOM 14: ROOT SHRINE (P3) ───
    {
      id: 'root_shrine',
      name: 'Root Shrine',
      zone: 'forest',
      descriptionFirst: `The path opens into a space that was made.

Not by hands. Roots have grown into the shape of an alcove, and at the centre of the alcove a basin formed from the same material — root grown thick and bowled and fused. The basin is empty. Something used to be left here. The forest accepted it.

A circle of smaller bowls surrounds the central one. Each tilted slightly toward the centre.

You can read the meaning of this place though no language has been used.`,

      description: `The Root Shrine. A grown alcove. Empty offering bowls. The forest is waiting.`,

      prophecy: {
        id: 'P3',
        title: 'The Prayer of the House',
        text: `The turning is a prayer the house speaks to itself.
Every prayer ends the same.
The walls are thinner now.
The hand that built them trembles.
The pattern will break or the pattern will hold
and neither is written.`
      },

      examineTargets: {
        'basin': 'Hollowed root. The interior is dark and damp. Whatever was placed here was taken.',
        'bowls': 'A dozen of them. Each tilted toward the centre. The geometry is precise.',
        'shrine': 'Built without hands. Whatever shaped it knew what it was doing.',
        'alcove': 'The roots above the basin curve inward. Sheltering it. Or watching it.',
        'lintel': 'Where the path ends and the alcove begins, on the lintel-root that arches into the shrine: a letter. **R**.'
      },

      hints: [
        'The forest left bowls here for a reason. They are empty for a reason too.',
        'What you give to the forest, the forest may protect you with later — somewhere else.',
        'Leave the bone knife in the basin. The forest will recognise the offering at the Feeding Ground.'
      ],

      actions: [
        {
          id: 'leave_offering_knife',
          label: 'Leave the bone knife in the basin',
          requires: { hasItem: 'bone_knife' },
          text: `You set the bone knife in the basin.

The roots beneath it shift, slow as breathing, and the knife sinks half its length into the wood. The wood closes around it.

The forest has accepted what you brought.`,
          once: true,
          setFlag: { forest_offered: true },
          consumeItem: 'bone_knife',
          type: 'narration'
        }
      ],

      exits: {
        south: { roomId: 'tangled_path', label: 'Back to the path' },
        east: { roomId: 'feeding_ground', label: 'A trail east, dark with old stains' },
        west: { roomId: 'fungal_hollow', label: 'West toward the fungal growth' }
      }
    },

    // ─── ROOM 15: FEEDING GROUND (TIMED, DEATH) ───
    {
      id: 'feeding_ground',
      name: 'Feeding Ground',
      zone: 'forest',
      descriptionFirst: `The smell hits first. Iron and meat and something older.

You step through a curtain of vines and stop.

The ground is dark with what the ground is dark with. Bones. Some still with strips. The vines overhead carry stains that have run downward over years.

This is a place where things eat. The eating is recent. The eating is also old.

Do not stay.`,

      description: `The feeding ground. Bones. Recent kills. Whatever feeds here is not far.`,

      examineTargets: {
        'bones': 'Some old. Some not. The marrow has not yet dried in the freshest of them.',
        'vines': 'Stained from above. Whatever feeds here likes height.',
        'ground': 'Soft from years of soaking. You do not want to look closely at what your foot has displaced.',
        'canopy': 'Thicker here than elsewhere. Something has woven the vines into a roost.'
      },

      hints: [
        'This room counts. You have a small number of breaths before what feeds here finds you.',
        'If the forest has accepted something from you elsewhere, it may hide you from what is coming.',
        'Make an offering at the Root Shrine first, then return here. Step into the wall where it gives.'
      ],

      timer: {
        turns: 3,
        onExpire: 'death',
        warningOnEnter: 'Something shifts in the canopy above you. The vines ripple where nothing should be moving them.',
        warning: 'Closer now. The smell has changed. The thing that feeds here knows you are here.',
        warningAt: 1,
        bypassFlag: 'vrethkai_witnessed',
        deathText: `It came down from the canopy.

You did not see what it was. That was a mercy.

You forget your name. You forget you had one.`
      },

      actions: [
        {
          id: 'hide_in_growth',
          label: 'Step into the wall where it gives',
          requires: { hasFlag: 'forest_offered' },
          text: `The roots open for you.

You step into a fold in the wall that was not there a moment ago and the growth closes behind your shoulder.

From inside the fold you watch it come down. Long. Pale. Wrong in the joints. It moves through the bones with a care that is not gentleness. It eats. It eats for a long time. It leaves.

When the forest opens again you have learned the shape of the thing the cycle keeps locked away. You will not forget the shape.`,
          once: true,
          setFlag: { vrethkai_witnessed: true },
          type: 'narration'
        }
      ],

      exits: {
        west: { roomId: 'root_shrine', label: 'Back to the shrine (quickly)' }
      }
    },

    // ─── ROOM 16: FUNGAL HOLLOW (gateway to Fungal sub-biome) ───
    {
      id: 'fungal_hollow',
      name: 'Fungal Hollow',
      zone: 'forest',
      descriptionFirst: `The forest gives way to fungus.

The trees here are dead but standing. Bark and shelf-fungus have become one surface. Caps the size of dinner plates spiral up the trunks. The light is brighter, a richer blue, almost cyan. The air smells of damp earth and something sweeter beneath.

A passage descends in the floor. Narrow. Breathing warm air upward. The fungus around its lip is thicker than anywhere else.

Whatever is below has been growing for longer.`,

      description: `The Fungal Hollow. Dead trees made into fungal towers. A passage descends, breathing.`,

      examineTargets: {
        'trees': 'Dead. The fungus has remade them. You cannot tell where the bark ends.',
        'caps': 'Each cap a span across. They face inward, toward the centre of the hollow.',
        'passage': 'A narrow throat in the soil. Air rises from it, warmer than the forest. Something sweeter than damp.',
        'fungus': 'Layered, ancient. The newest growth is barely a year old. The oldest could be centuries.',
        'lintel': 'On the largest dead trunk where the path enters, a letter has been carved into bark and the fungus has carefully grown around it without covering. **U**.'
      },

      exits: {
        north: { roomId: 'spore_corridor', label: 'Back through the spores' },
        east: { roomId: 'root_shrine', label: 'East to the shrine' },
        south: { roomId: 'root_cathedral', label: 'South into the cathedral of roots' },
        down: { roomId: 'spore_veil', label: 'Down the breathing passage' }
      }
    },

    // ─── ROOM 17: ROOT CATHEDRAL (Warden identity) ───
    {
      id: 'root_cathedral',
      name: 'Root Cathedral',
      zone: 'forest',
      descriptionFirst: `A space the forest grew like a building.

Roots arranged in pillars along a central avenue. Two rows. Twelve in all. The ceiling vaults overhead, tall enough that the bioluminescence cannot reach it. At the far end, where an altar would stand in the architecture of your own people, a tangle of roots forms something like a face.

The face is not finished. It is also not unfinished. It is what the forest decides to be when something with eyes is watching.

You can feel the forest looking back.`,

      description: `The Root Cathedral. Living pillars. A face in the roots. The forest watches.`,

      examineTargets: {
        'pillars': 'Roots grown into columns. Twelve of them. They were grown to remember a number.',
        'face': 'It changes when you blink. Not the features. The intention.',
        'avenue': 'Worn smooth. Many feet have walked here, or what passed for feet.',
        'ceiling': 'Lost in the dark. The light from the moss does not climb that high.',
        'lintel': 'Where the avenue begins, on a root that arches across the entry, a letter has been carved by patient hand. **C**. The forest has not closed the cut.'
      },

      actions: [
        {
          id: 'choose_warden',
          label: 'Kneel before the face',
          requires: { noIdentity: true },
          text: `You go down to one knee.

The face does not change. Nothing in the cathedral changes. The pillars do not lean. The light does not shift.

You speak something into the soil that you did not know you were going to speak. A promise shaped to fit the thing kneeling here. To watch. To stand at the edge of the dark and not let it pass.

The forest does not answer. The forest does not need to.

When you rise the air has changed against your skin. You did not feel that change when you fell into the cavern. You feel it now. Some doors close behind people on purpose.`,
          once: true,
          setIdentity: 'warden',
          type: 'narration'
        },
        {
          id: 'recognize_other_path',
          label: 'Stand before the face',
          requires: { hasFlag: 'identity_chosen', not: { hasIdentity: 'warden' } },
          text: `You stand before the face again.

The forest knows what you became. The face has nothing more to ask of you. Whatever shape you carry now, you carry it elsewhere.`,
          once: true,
          type: 'narration'
        }
      ],

      exits: {
        north: { roomId: 'fungal_hollow', label: 'Back to the Fungal Hollow' },
        east: { roomId: 'crystal_grove', label: 'East to the crystal light' },
        west: { roomId: 'hollow_tree', label: 'West, where a great tree stands' }
      }
    },

    // ─── ROOM 18: CRYSTAL GROVE (P4) ───
    {
      id: 'crystal_grove',
      name: 'Crystal Grove',
      zone: 'forest',
      descriptionFirst: `The roots in this part of the forest have grown around — or perhaps grown through — clusters of crystal that should not be here.

The crystals are pale, milky, faceted. They catch the bioluminescence and split it. The whole grove glows in overlapping shades of light. Each colour settles on a different surface. You stand in a space where light has learned where to land.

Carved into the bark of the central tree, where the crystal has broken through and the wound has scarred over, are words. The script is younger than the cavern's etching, older than the surface tongue. The letters slip when you stare straight at them. Look sideways and they hold.`,

      description: `The Crystal Grove. Crystal grown through bark. Words carved in scarred wood, glowing.`,

      prophecy: {
        id: 'P4',
        title: 'Before the Light',
        text: `Before the light there was a hand,
and the hand built a house with no doors.
Inside the house the hand lit a fire
that was too much,
that broke.`
      },

      examineTargets: {
        'crystals': 'Milky. Faceted. They were not placed here. They grew. The roots accommodated them. Each cluster is the same shape: one crystal cleaved into a pair, the two halves still joined at the base.',
        'tree': 'The central trunk. The crystal has burst from inside the wood and the wood has scarred over the wound.',
        'words': 'The same hand wrote at the Etching, at the Weeping Wall. Older here. Or trying to be.',
        'light': 'Split into colours by the crystal. The forest below this grove is striped in red, blue, gold.',
        'pair': 'Each crystal cluster shows the same form — one cleaved in two, halves still joined. Whatever made them broke them at birth.',
        'lintel': 'Where the path enters the grove, at a place between two roots that arch into a kind of doorway, a letter has been cut into the bark and the wood has grown around it without closing. **E**. The cut is deep. The wood agreed to remember.'
      },

      exits: {
        north: { roomId: 'tangled_path', label: 'North to the tangled path' },
        west: { roomId: 'root_cathedral', label: 'Back to the cathedral' },
        south: { roomId: 'clearing', label: 'South where the canopy opens' },
        east: { roomId: 'canopy', label: 'East and up — the canopy rises' }
      }
    },

    // ─── ROOM 19: THE CANOPY (Escape 4) ───
    {
      id: 'canopy',
      name: 'The Canopy',
      zone: 'forest',
      descriptionFirst: `The forest rises here.

You climb. The roots become branches and the branches become more roots and the more you ascend the more it stops mattering which is which.

Far above you, you see something you have not seen in days: actual sunlight.

It comes through cracks in the world above. Thin shafts. Dust dances in them. The light is not bioluminescent, not fed on damp soil. It is the sun, filtered through stone.

There is a path up. Several paths. Not all of them go where they seem.`,

      description: `The Canopy. Real sunlight far above. Multiple paths up. Not all are safe.`,

      examineTargets: {
        'sunlight': 'Thin and grey. The sun above this place is also the sun you fell from. You did not know how much you missed it.',
        'paths': 'Three obvious routes. The central trunk rises straight. The eastern branch reaches out broad. The western root hooks back on itself.',
        'central trunk': 'Thick and steady. The bark is worn smooth where hands have climbed before yours.',
        'eastern branch': 'Solid. The branch holds weight without bowing. The bark is rough where something has gripped it — repeatedly, in the same places.',
        'western root': 'It curls back into the canopy and disappears. Where it goes is not the surface.',
        'canopy': 'Dense above. Higher up, the green opens out into something paler — vines woven into a hollow, big enough to hold a body.'
      },

      hints: [
        'Above you is not empty. Standing too long will end you.',
        'Read the paths, but read fast. One has been climbed by hands like yours. The other two have not.',
        'Take the central trunk. Do not linger.'
      ],

      timer: {
        turns: 5,
        onExpire: 'death',
        warningOnEnter: 'The vines above you ripple. Nothing has moved them.',
        warning: 'Above you, the light through the canopy has changed. Something is between you and the sun.',
        warningAt: 2,
        deathText: `It was already in the canopy with you.

You did not see what it was. You did not need to.

You forget your name. You forget you had one.`
      },

      actions: [
        {
          id: 'climb_central',
          label: 'Take the centre',
          text: `You take the central path.

The bark is dry. Your hands find old grips worn into the wood. The blue-green light fades behind you. The grey light grows.`,
          setFlag: { escape_route: 'canopy' },
          moveTo: 'exit_surface'
        },
        {
          id: 'climb_eastern',
          label: 'Take the east',
          text: `You step out onto the dry branch.

It holds for three paces. On the fourth it does not.

You forget your name. You forget you had one.`,
          death: true
        },
        {
          id: 'climb_western',
          label: 'Take the west',
          text: `You follow the curl of the root back into the canopy.

It goes deeper than you expected. The light around you greens again. The leaves close above. After a long while you understand the root has been carrying you down, not up, in a slow curve you did not feel turning.

When the leaves part something is waiting in the hollow at the centre of the curl. It has too many eyes and it knows your name.

You forget your name. You forget you had one.`,
          death: true
        }
      ],

      exits: {
        west: { roomId: 'crystal_grove', label: 'Back down to the grove' }
      }
    },

    // ─── ROOM 20: HOLLOW TREE (Forest shard) ───
    {
      id: 'hollow_tree',
      name: 'Hollow Tree',
      zone: 'forest',
      descriptionFirst: `The largest tree in the forest stands here, and it is hollow.

Not by accident. Something lived inside it for a long time and is no longer there. The opening at its base is wide enough to step through. Inside, the air is dry. The walls of the trunk are smooth, polished by use. The hollow rises into darkness above.

In the centre of the floor, set into a depression in the wood, there is something that pulses. A fragment. Pale. Warm. The heart of the forest, or what was left when the heart was taken.

Now it sits where any hand can take it.`,

      description: `The Hollow Tree. A trunk made into a chamber. A pulsing fragment in a depression in the floor.`,

      examineTargets: {
        'tree': 'The trunk is wider than three of you with arms outstretched. The wood is older than any cycle you can name. A great hollow tree — the only one of its kind in this forest.',
        'walls': 'Smooth. Worn. Whatever lived here kept the walls clean.',
        'fragment': 'Pale. Pulsing. Warm even at a distance. It feels less like an object than a piece of something larger that wants to find the rest.',
        'depression': 'A hollow worn into the wood by a long act of holding. Something rested here for centuries.',
        'lintel': 'Above the opening at the trunk\'s base, scratched into the wood by a knife: a single letter. **T**. The cut is shallow. Someone wanted it to last but had no time for depth.'
      },

      hints: [
        'Whatever rests here has rested here for centuries. It is not protected from your hand.',
        'Lift the fragment from the depression. It is yours to carry now.',
        'Take the relic shard. The deeper paths require it.'
      ],

      actions: [
        {
          id: 'take_forest_shard',
          label: 'Lift it from the depression',
          text: `You lift it from the depression.

It is warmer than it should be. It pulses against your palm with a rhythm that does not match yours and is not trying to.

The tree does not protest. The forest, somewhere distant, notices.

A relic shard. A piece of something much larger and much older. You do not know what it was. Your hands do not want to let go.`,
          once: true,
          giveItem: 'relic_shard_forest',
          giveRelic: 'shard_forest',
          type: 'narration'
        }
      ],

      exits: {
        east: { roomId: 'root_cathedral', label: 'Back to the cathedral' },
        south: { roomId: 'clearing', label: 'South into a break in the canopy' }
      }
    },

    // ─── ROOM 21: THE CLEARING ───
    {
      id: 'clearing',
      name: 'The Clearing',
      zone: 'forest',
      descriptionFirst: `A break in the canopy.

You can see the ceiling here. High. Far. The same vault-stone you saw at the Hollow. The bioluminescent moss climbs the trunks but does not reach the ceiling. The space between is a kind of sky.

The forest invites you to rest. The ground is soft. The air is clean. Something large enough to be a deer crosses the far edge of the clearing and pauses to look at you. It has eyes. You can count them. There are too many.

It moves on. The clearing is again only a clearing.

You realize, slow, that the rest the clearing offered was a question. You had been going to say yes.`,

      description: `The Clearing. A vault-ceiling sky. False rest. Something watched you and moved on.`,

      examineTargets: {
        'ceiling': 'Stone. High enough to forget. The moss does not reach it. Whatever lives at that height does not need light.',
        'ground': 'Soft moss over deeper soil. Your boot sinks in past the lace and keeps sinking. You pull it back out.',
        'deer': 'Gone now. The shape of where it stood is still pressed into the moss. The print is wrong.',
        'sky': 'Not sky. Stone pretending to be sky for the moss\'s benefit. The forest copies what it has heard about.'
      },

      exits: {
        north: { roomId: 'crystal_grove', label: 'Back to the crystal grove' },
        west: { roomId: 'hollow_tree', label: 'West to the great tree' },
        south: { roomId: 'the_wound', label: 'South where the forest ends badly' }
      }
    },

    // ─── ROOM 22: THE WOUND (Escape 5 + descent to Ruins I) ───
    {
      id: 'the_wound',
      name: 'The Wound',
      zone: 'forest',
      descriptionFirst: `Where the forest ends, it does not end peacefully.

Something tore through here. The roots are not arranged but ripped — thick limbs of growth sundered along their grain, exposing pale interior wood that has never been pale, never been interior, never been seen. The ground beneath is split. A chasm runs across the southern edge of the clearing. The chasm goes down.

The wound is old. The forest has not healed it.

To the west, where the bark hangs in strips, a tunnel of root-channels leads upward. A way home, if home still means something to you. The forest will let you take it. Only if it has decided to.

To the south, the chasm continues into stone. You can see the edge of carved architecture at the bottom of the drop. Something built. Older than the forest above it.`,

      description: `The Wound. Where the forest was torn. A tunnel up. A drop down to ruins.`,

      examineTargets: {
        'chasm': 'Wider than it looked. The drop is twenty feet at the shallow end. Below, stone that was shaped.',
        'tunnel': 'Root-channels braided into a passage. They breathe slow. They are still alive.',
        'wound': 'Old. The wood has tried to scar over and failed. Something kept it open.',
        'architecture': 'Stone steps, half-buried. The first ruin. You can see the edge of a carved column.'
      },

      actions: [
        {
          id: 'take_root_tunnel',
          label: 'Climb',
          requires: { hasIdentity: 'warden' },
          text: `The roots part for you.

You climb. The forest does not resist your ascent. It does not assist it either. You move through living wood that knows your name now. The wood thins. The wood ends. The roots open onto soil. The soil opens onto sky.`,
          setFlag: { escape_route: 'root_tunnel' },
          moveTo: 'exit_surface'
        }
      ],

      exits: {
        north: { roomId: 'clearing', label: 'Back to the clearing' },
        down: { roomId: 'threshold_hall', label: 'Drop into the ruins below' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — FUNGAL SUB-BIOME (F1-F6)
    // Beneath Fungal Hollow. The mycelium thinks.
    // ═══════════════════════════════════════════

    // ─── ROOM F1: SPORE VEIL ───
    {
      id: 'spore_veil',
      name: 'Spore Veil',
      zone: 'forest',
      descriptionFirst: `The descent from the Fungal Hollow opens into a chamber that is not a chamber. It is a curtain.

Spores drift here in such density the air is white-blue with them. They part in front of your face and close behind you. You can see only a few feet in any direction. Sound does not carry. Whatever is making noise — and something is — sounds like it is making the noise from a great distance, even when you can feel it on your skin.

If you stay here, the spores will do something. You can feel that. They are negotiating with you already. You are losing.`,

      description: `The Spore Veil. White-blue air. The spores want something.`,

      examineTargets: {
        'spores': 'Denser than air. They part for you. They do not part with you.',
        'sound': 'Comes from the south. Or the spores. The veil refuses to commit.',
        'veil': 'There is no edge to it. The curtain hangs in the air without anything to hang from. Parallel sheets of suspended drift, blurring into each other.',
        'curtain': 'The veil is a curtain in everything but name. Parallel sheets of suspended drift, blurring into each other.',
        'lintel': 'Above the descent — where the passage from the Fungal Hollow opens into this chamber — a letter has been pressed into the soft soil at the edge of the threshold. The mark is faint but legible. **S**.'
      },

      timer: {
        turns: 5,
        onExpire: 'death',
        warningOnEnter: 'The spores have begun to settle on the inside of your throat. You can feel them taking root.',
        warning: 'Your hand is not where you remember leaving it. The spores have started speaking to your body in your body\'s language.',
        warningAt: 2,
        deathText: `The veil takes a long time about it.

You are aware, for a while, of new growth. Your hands forget how hands close. Your name takes its leave.

You forget you had one.`
      },

      useItems: [
        {
          itemId: 'hollow_reed',
          label: 'Breathe through the hollow reed',
          text: `You put the reed to your mouth and draw breath through it.

The spores stop arriving. The negotiation pauses. The veil is still around you, but it has lost its handhold inside your lungs.

You will need both hands free for what is below.`,
          consumeItem: false,
          setFlag: { spore_filter_active: true }
        }
      ],

      exits: {
        up: { roomId: 'fungal_hollow', label: 'Back up to the Fungal Hollow' },
        south: { roomId: 'mycelium_web', label: 'Through the veil, southward' }
      }
    },

    // ─── ROOM F2: MYCELIUM WEB ───
    {
      id: 'mycelium_web',
      name: 'Mycelium Web',
      zone: 'forest',
      descriptionFirst: `The chamber beyond the veil is wider, drier, built of strands.

The walls are not walls. They are networks of fine fungal threads, layered into the appearance of a surface. Where the threads thicken they are nearly translucent. Where they meet they pulse, slow, in a rhythm that is not yours.

You hear something. Not aloud. In the back of your mouth, behind your teeth. A thought forming itself with someone else's grammar.

It is not unpleasant. That is the worst of it.`,

      description: `The Mycelium Web. Walls of fungal threads. Thoughts arrive in someone else's grammar.`,

      examineTargets: {
        'threads': 'Finer than spider-silk. Layered into surfaces that hold weight. The fungus does not believe in walls but is willing to imitate them.',
        'walls': 'A pretense. The fungus is the wall. The wall is the fungus.',
        'thoughts': 'They are not yours. The grammar is wrong. The vocabulary is older.',
        'rhythm': 'Slow. Not your heart. Not the forest above. Something below both.',
        'web': 'A network of threads radiating outward from a central knot, repeating itself across every surface. Whoever lived here mapped the whole place in their own body.',
        'network': 'A network of threads radiating outward from a central knot, repeating itself across every surface.',
        'lintel': 'Above the threshold from the north, in the soil-and-fungus that has hardened into a kind of frame, a single letter has been pressed: **N**. The fungus has grown around it carefully, leaving it readable.'
      },

      exits: {
        north: { roomId: 'spore_veil', label: 'Back through the veil' },
        west: { roomId: 'decaying_ones', label: 'West where the thoughts are loudest' },
        south: { roomId: 'mother_tangle', label: 'South toward the centre' },
        east: { roomId: 'inverted_grove', label: 'East where the gravity disagrees' }
      }
    },

    // ─── ROOM F3: THE DECAYING ONES ───
    {
      id: 'decaying_ones',
      name: 'The Decaying Ones',
      zone: 'forest',
      descriptionFirst: `The fungus has been at work here longer than anywhere else.

The chamber is a bone garden. Skulls — human, you think, or close to it — nest in the soft floor. Mushrooms grow from the eye sockets in tidy clusters. Larger growths erupt from rib cages. Some bones are old and picked clean. Others are fresher. The fungus has not had time to take all of them.

These were not buried. They were placed.

A small bowl of stone sits at the centre of the chamber, surrounded by skulls that face it. In the bowl, a token. Black. Cold. Heavy in a way bone never is.`,

      description: `The Decaying Ones. A garden of skulls and fungus. A bowl. A black token.`,

      examineTargets: {
        'bones': 'Some are old beyond measure. Others are recent. The fungus is patient and the fungus is hungry.',
        'skulls': 'Human-shaped. Mostly. Some have grown together with the fungus too completely to be sure.',
        'mushrooms': 'Tidy clusters in the sockets. They are reading what the bones still remember.',
        'bowl': 'Stone. Older than the bones. Older than the fungus. Whatever brought it here did not bring it for the fungus.',
        'token': 'Black stone. The light does not stay where it falls on it.'
      },

      items: ['decay_token'],

      exits: {
        east: { roomId: 'mycelium_web', label: 'Back to the web' }
      }
    },

    // ─── ROOM F4: MOTHER TANGLE (P5) ───
    {
      id: 'mother_tangle',
      name: 'Mother Tangle',
      zone: 'forest',
      descriptionFirst: `The fungal network thickens, spirals, climbs.

The chamber at its centre is round, low-ceilinged, walled in by a single mass of growth that you understand, looking at it, is one organism. The walls breathe slow. The ceiling pulses.

In the middle of the floor, a depression. A bed of softer fungus. Something has slept here. Slept, not died. You can see the impression of a body still warming the moss.

The walls are written on. Not by a hand — the threads themselves have grown into the shape of words. The script is the same you found at the Etching, the Weeping Wall, the Scriptorium. The fungus has read those places. It remembers what was written there. It has copied a passage you have not yet found.`,

      description: `The Mother Tangle. A living chamber. A bed where something slept. Fungal walls quoting the prophecy.`,

      prophecy: {
        id: 'P5',
        title: 'The Patient Fire',
        text: `The fire does not lie.
It has never needed to.
Patient in the dark,
learning the shape of every wanting,
wearing the face of every wound,
whispering to the cracks in everything that stands.
What it offers it can give.
What it takes it does not return.`
      },

      onEnter: function(engine) {
        engine.flags.fire_name_syllable_patient = true;
      },

      examineTargets: {
        'walls': 'One organism. The whole chamber is one growth. It is paying attention to you. The threads spiral inward toward the centre — every wall is a coil that does not stop.',
        'spiral': 'The whole chamber is a coil. The walls spiral inward and inward, threads tightening toward where the body sleeps.',
        'coil': 'The walls coil inward. The pattern repeats at every scale you look at it.',
        'bed': 'Recent. Whatever sleeps here has slept here for a long time and slept here this week.',
        'words': 'The threads have grown into letters. The fungus learned to write by reading.',
        'depression': 'Body-shaped. Larger than yours. The shape is uncertain at the edges, where it shifted while sleeping.',
        'ceiling': 'Pulsing. The same rhythm you heard in the Mycelium Web. This is where it begins.',
        'lintel': 'Where the threads thicken into the doorway you came through, a letter has been grown into the fungus by careful pruning. The growth has been kept clean. **S**.'
      },

      exits: {
        north: { roomId: 'mycelium_web', label: 'Back to the web' },
        down: { roomId: 'quiet_room', label: 'Down through a gap in the floor' }
      }
    },

    // ─── ROOM F5: INVERTED GROVE ───
    {
      id: 'inverted_grove',
      name: 'Inverted Grove',
      zone: 'forest',
      descriptionFirst: `The chamber slopes downward but the fungus grows upward — from the ceiling.

Caps the size of small shields hang above you, their stems reaching down toward your head. Some brush your hair as you pass. The light comes from below your feet, from a layer of moss carpeting the floor like dropped sky.

Your inner ear protests. The forest's gravity does not match the chamber's. You have to remind your body which way is down. Your body sometimes disagrees.`,

      description: `The Inverted Grove. Mushrooms grow from the ceiling. Light from the floor. Gravity does not negotiate.`,

      examineTargets: {
        'ceiling': 'Soil. The fungus has rooted into it from below — or above, if you let yourself believe what your eyes are telling you.',
        'floor': 'Moss. Glowing. The light is meant to belong to a sky.',
        'mushrooms': 'The stems reach down. The caps face you. They are listening.',
        'gravity': 'Honest in this room. Wrong everywhere else. Or the other way.'
      },

      onEnter: function(engine) {
        engine.flags.gravity_lesson_learned = true;
      },

      exits: {
        west: { roomId: 'mycelium_web', label: 'Back to the web' }
      }
    },

    // ─── ROOM F6: THE QUIET ROOM ───
    {
      id: 'quiet_room',
      name: 'The Quiet Room',
      zone: 'forest',
      descriptionFirst: `There is a chamber here the forest has not touched.

The walls are the same packed soil as the rest of the network, but no fungus grows on them. No spores drift. The bioluminescent threads end at the threshold and do not enter. There is no sound. Not the absence of sound — the prevention of it. You speak and your voice does not arrive in your own ears.

In the centre of the room, on a low stone that does not belong to any layer of the forest, sits something small and grey. A stone. Round. Smooth. It does not glow. It does not pulse.

It is the only thing in the world right now that is not trying to be heard.`,

      description: `The Quiet Room. The forest does not enter here. A grey stone sits on a stone that does not belong.`,

      examineTargets: {
        'walls': 'Soil. Untouched. The forest agreed not to come this far.',
        'stone': 'Grey. Smooth. Older than the chamber that holds it. Older than the fungus that surrounds the chamber.',
        'pedestal': 'Stone. Not from the forest. Not from any cycle the forest has names for. Someone set it down here on purpose.',
        'silence': 'It is doing work. The kind of silence that holds something off. You suspect, the longer you stand inside it, that holding something off and waiting for something are not different things here.',
        'wait': 'You stand still. The silence does not change. You do not change within it. Whatever this room is for, the room does not announce itself.'
      },

      items: ['quiet_stone'],

      exits: {
        up: { roomId: 'mother_tangle', label: 'Back up through the gap' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — RUINS I: THE CARVED CITY (preview)
    // ═══════════════════════════════════════════

    // ─── ROOM: THRESHOLD HALL ───
    {
      id: 'threshold_hall',
      name: 'Threshold Hall',
      zone: 'ruins1',
      descriptionFirst: `You step through an archway that was old when the world above was young.

The hall beyond is wide enough for twenty people to walk abreast. The ceiling arches overhead in a style you almost recognize — not your people's work, but not alien either. Close. Like a word in a language you nearly speak.

Columns line both sides, carved with patterns that repeat and vary. Dust lies thick on the floor. Your footprints are the first in centuries.

At the far end, the hall branches. Passages lead east and west, and a grand stairway descends further into the dark.

These people built well. They built to last. It wasn't enough.`,

      description: `Threshold Hall. A wide corridor lined with carved columns. Dust on the floor. Passages branch east and west. A stairway descends.`,

      examineTargets: {
        'columns': 'Carved with repeating patterns — geometric at first glance, but the more you look, the more they suggest something organic. Growth, maybe. Or consumption.',
        'dust': 'Centuries deep. Fine as powder. Your footprints in it feel like vandalism.',
        'archway': 'The entrance behind you. The keystone is carved with a symbol you\'ve never seen — a circle inside a circle, with lines radiating outward. Or inward.',
        'stairway': 'Wide. The steps are shallow, built for a procession. Whatever happened down there, people went to it in numbers.',
        'lintel': 'Above the entry from the wound, scratched into the cycle-old stone in a hand that did not match the architects: a single letter. **X**. The mark is large, almost defiant. Whoever made it wanted no confusion about which place this was.'
      },

      exits: {
        up: { roomId: 'the_wound', label: 'Climb back up to the Wound (Forest)' },
        north: { roomId: 'crack_in_stone', label: 'Through the crack in the stone' },
        east: { roomId: 'scriptorium', label: 'East passage' },
        west: { roomId: 'collapsed_archive', label: 'West passage' },
        south: { roomId: 'mural_chamber', label: 'South past a colonnade' },
        down: { roomId: 'hall_of_names', label: 'Descend the grand stairway' }
      }
    },

    // ─── ROOM: SCRIPTORIUM (Prophecy P6) ───
    {
      id: 'scriptorium',
      name: 'The Scriptorium',
      zone: 'ruins1',
      descriptionFirst: `A room built for keeping words.

Stone shelves line every wall, carved directly from the rock. Most are empty — whatever they held has crumbled or been taken. But the walls themselves are covered in text, floor to ceiling, in a careful hand that must have taken years to complete.

Most of the writing has faded or been damaged by moisture seeping through the stone. But one section, protected by an overhang in the rock, remains legible. The script is old but you can read it. The words settle into you like something you already knew but had forgotten.`,

      description: `The Scriptorium. Stone shelves, faded text covering every wall. One section remains legible under a protective overhang.`,

      prophecy: {
        id: 'P6',
        title: 'The Dust Remembers',
        text: `The dust of the eaten settles in the cracks
and remembers what the living forget.
Every name. Every fire.
Every hand that reached for another hand
and found only the turning.`
      },

      examineTargets: {
        'shelves': 'Empty. Whatever they held — scrolls, tablets, books made from materials you can\'t guess — is gone. Only the stone remains.',
        'text': 'Floor to ceiling. Thousands of words. Most damaged beyond reading. The hand that wrote this spent years here.',
        'overhang': 'A natural feature in the stone that the builders incorporated. The text beneath it has been protected from moisture for centuries. Lucky. Or planned.'
      },

      exits: {
        west: { roomId: 'threshold_hall', label: 'Back to the hall' }
      }
    },

    // ─── ROOM: COLLAPSED ARCHIVE ───
    {
      id: 'collapsed_archive',
      name: 'Collapsed Archive',
      zone: 'ruins1',
      descriptionFirst: `The west passage opens into what was once a large room, now half-filled with rubble from a ceiling collapse. Stone shelves have been crushed. Fragments of carved tablets litter the floor, their text broken mid-sentence.

The collapse happened long ago — the edges of the broken stone have softened with time. But it wasn't natural. The pattern of the fall suggests something struck from above with tremendous force.

Through the rubble, you can see the edge of another room beyond. Inaccessible, unless you can clear a path.`,

      description: `The collapsed archive. Rubble from a ceiling collapse fills half the room. Another space is visible beyond the debris.`,

      examineTargets: {
        'rubble': 'Heavy but not immovable. The stones at the top of the pile could be shifted with enough leverage.',
        'tablets': 'Broken. The text on them is in the same script as the Scriptorium. You can read fragments: "...when the turning stops..." and "...the hand that built..." but nothing complete.',
        'collapse': 'Not natural. Something hit this ceiling from above, hard. An impact, not erosion.'
      },

      useItems: [
        {
          itemId: 'pry_bar',
          label: 'Clear rubble with the pry bar',
          text: 'You work the iron bar between the stones at the top of the pile, levering them aside one by one. It takes time and sweat, but a gap opens. Beyond it, a smaller room — intact, sealed by the collapse for centuries.',
          setFlag: { archive_cleared: true },
          revealExit: 'sealed_vault',
          revealText: 'A gap opens into the sealed room beyond.'
        }
      ],

      actions: [
        {
          id: 'enter_vault',
          label: 'Crawl through to the sealed room',
          requires: { hasFlag: 'archive_cleared' },
          moveTo: 'sealed_vault'
        }
      ],

      exits: {
        east: { roomId: 'threshold_hall', label: 'Back to the hall' },
        south: { roomId: 'offering_niche', label: 'A side passage south' },
        up: {
          roomId: 'ventilation_shaft',
          label: 'Up the ventilation shaft (the builders left a way out)',
          requires: { hasFlag: 'archive_cleared', hasAnyItem: ['rope', 'bone_knife'] },
          blockedText: 'Above the cleared rubble, a stone-lined shaft opens. The builders cut it for ventilation. Without rope or a blade to chip handholds, the climb would be impossible.'
        }
      }
    },

    // ─── ROOM: VENTILATION SHAFT (Archive Shaft — Escape #6) ───
    {
      id: 'ventilation_shaft',
      name: 'Ventilation Shaft',
      zone: 'ruins1',
      descriptionFirst: `Above the cleared rubble, the shaft cuts straight up through the bones of the ruined city. The stonework is precise — the builders meant for someone to use this.

It is narrow enough to brace against. It is long enough that you will not see the top until you are most of the way there.

You climb. The carved walls grip your palms — every grip cut at a thumb's reach, every step set where a tired foot would set itself. Whatever blade or rope you brought tells you which method you trust most.

Halfway up, the shaft passes a small alcove — a cell in the stone, too small to be a room, where the air stops smelling of dust.`,

      description: `The ventilation shaft. Carved stone. A long, careful climb. Halfway up, an alcove.`,

      examineTargets: {
        'shaft': 'Cut by hand, by craftsmen who knew air. The walls are textured precisely enough to grip.',
        'walls': 'Stone the colour of old bread. Carved by the people who built this city before the cycle ate them.',
        'alcove': 'A small cut in the wall halfway up. Just deep enough for one person to sit in. Whoever cut it intended it to be sat in.',
        'air': 'Cleaner than the air below. The shaft works — it is doing what its makers built it to do.'
      },

      hints: [
        'The shaft is climbable. The alcove halfway up is worth a second look.',
        'Examine the alcove. Builders cut spaces into vertical climbs for a reason — to rest, or to leave something for whoever climbed after them.',
        'In the alcove halfway up, you find a small bone fragment carved with prophecy script — and the climb continues to the surface.'
      ],

      actions: [
        {
          id: 'continue_climb',
          label: 'Continue up to the surface',
          text: `You leave the alcove and continue up. The shaft narrows near the top — barely wide enough — and then opens onto a flat stone, in a stand of grey grass, in the wind.

You are out.`,
          setFlag: { escape_route: 'archive_shaft' },
          moveTo: 'exit_surface'
        }
      ],

      exits: {
        down: { roomId: 'collapsed_archive', label: 'Climb back down to the archive' }
      }
    },

    // ─── ROOM: HALL OF NAMES ───
    {
      id: 'hall_of_names',
      name: 'Hall of Names',
      zone: 'ruins1',
      descriptionFirst: `The grand stairway ends in a circular chamber. The walls are covered in names.

Thousands of them. Cut into the stone in rows so straight they must have used a guide. Each name has a small symbol beside it — different for each, though some symbols repeat. A system you don't understand. A record of people who lived and were worth recording.

The newest names — the ones nearest the door, carved last — have a different quality. The letters are less certain. The hand that made them was shakier, or in more of a hurry.

At the center of the chamber, a stone plinth. On it, nothing. A space where something was meant to go but never did, or was taken.`,

      description: `The Hall of Names. A circular chamber. Thousands of names carved in rows on every wall. A stone plinth at the center, empty.`,

      examineTargets: {
        'names': 'Thousands. Each one a person. Some of the symbols beside them repeat — ranks, maybe, or roles. The earliest names are cut deep and clean. The latest are shallow and hurried.',
        'plinth': 'Stone. The top surface has an indentation — something was meant to sit here. The shape is circular, about the size of a fist. It has been empty for a very long time.',
        'symbols': 'You can\'t read them. But some appear more often than others. One symbol — a vertical line bisected by a curve — appears beside the last dozen names. Whatever it meant, it was common at the end.',
        'lintel': 'Above the stairway down from the threshold, scratched in the same hand as the marks elsewhere: a letter. **N**. Whoever was mapping had been here. Whoever was mapping died before completing their map.'
      },

      actions: [
        {
          id: 'choose_scholar',
          label: 'Find a bare space and pick up the sharp stone',
          requires: { noIdentity: true },
          text: `You pick up a sharp stone from the floor and find a bare space near the newest names. You carve your name — your real name, the one you carried down here from the surface — into the wall beside theirs.

The symbol you draw beside it is the vertical line bisected by a curve. You don't know what it means. But it felt right.

Something shifts in you. You came down here and you don't know why, not yet. But you know you want to understand. The names on these walls belonged to people who understood, once. You will be one of them.`,
          once: true,
          setIdentity: 'scholar',
          type: 'narration'
        },
        {
          id: 'recognize_other_path_scholar',
          label: 'Walk between the names',
          requires: { hasFlag: 'identity_chosen', not: { hasIdentity: 'scholar' } },
          text: `You walk between the rows of names.

Your hand finds the chisel-weight of the air, and lets it go. Your name is not for this wall. You carry a different commitment, and the wall knows.`,
          once: true,
          type: 'narration'
        }
      ],

      exits: {
        up: { roomId: 'threshold_hall', label: 'Back up the stairway' },
        west: { roomId: 'reliquary', label: 'A passage west, plated in dull metal' },
        down: { roomId: 'cosmogony_wall', label: 'Down a stairway lit faintly from below' }
      }
    },

    // ─── ROOM: SEALED VAULT (Relic Shard 2) ───
    {
      id: 'sealed_vault',
      name: 'Sealed Vault',
      zone: 'ruins1',
      descriptionFirst: `The room beyond the collapse is small and perfectly preserved. The air is different here — dry, still, untouched for centuries. Dust lies in an even layer over everything, and everything is very little.

A single stone shelf. On it, a flat disc of dark stone and a cloth bundle, the fabric so old it crumbles at the edges but intact at the center.

The walls here have no text. No names. No decoration. This room was meant to hold things, not to be seen.`,

      description: `The sealed vault. Small, dry, untouched for centuries. A stone shelf holds a disc and a cloth bundle.`,

      examineTargets: {
        'disc': 'Heavy. Dark stone, almost black. Symbols on both faces, too precise to be decorative. The stone is warmer than the room.',
        'bundle': 'Old cloth wrapped around something that pulses faintly when you hold it. Like a heartbeat. The cloth crumbles as you unwrap it, revealing a fragment of crystal that glows with its own dim light.',
        'shelf': 'The only furniture. Built into the wall. Whoever placed these things here expected them to wait.',
        'lintel': 'Above the gap that was cleared from the archive, scratched into the broken edge of the wall: a letter. **V**. The mark is fresh — newer than the rest of the marks in this place. The mapper who came down here came down here recently.'
      },

      items: ['seal_stone'],

      actions: [
        {
          id: 'take_shard',
          label: 'Unwrap the cloth bundle',
          text: `The fabric crumbles in your hands. Inside, a fragment of crystal — no, not crystal. Something that looks like crystal but isn't. It pulses with a light that has no source, and when you hold it, you feel a warmth that travels up your arm and settles behind your eyes.

A relic shard. A piece of something much larger, much older. You don't know what it was part of. But your hands don't want to let go.`,
          once: true,
          giveRelic: 'shard_ruins1',
          type: 'narration'
        },
        {
          id: 'bind_seal_stone',
          label: 'Set the disc against the floor and turn it',
          requires: { hasIdentity: 'warden', hasItem: 'seal_stone' },
          text: `You set the disc against the floor of the vault and turn it three notches widdershins. The carving on its face shows you the angle.

The stone goes into the floor without leaving the floor. The disc remains in your hand. The pattern on it has changed.

Something has begun. The forest will know it. The deeper places will not.`,
          once: true,
          consumeItem: 'seal_stone',
          setFlag: { seal_stone: true },
          type: 'narration'
        }
      ],

      exits: {
        east: { roomId: 'collapsed_archive', label: 'Back through the gap' },
        west: { roomId: 'echoes', label: 'A breath of sound from the west' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — RUINS I COMPLETION (Mural Chamber, Reliquary, Offering Niche, Echoes, Cosmogony Wall)
    // ═══════════════════════════════════════════

    // ─── ROOM 26: MURAL CHAMBER (P7) ───
    {
      id: 'mural_chamber',
      name: 'Mural Chamber',
      zone: 'ruins1',
      descriptionFirst: `The chamber south of the Threshold Hall opens wide.

Every wall is painted. Not carved — painted. The pigments are dull where moisture has reached them, bright where the stone has held. Whatever ground them did so a long time ago, and whatever applied them did not expect the work to last forever. The work has lasted anyway.

The murals show a sky. Not your sky. A sky with too many lights in it, falling in long grey lines toward a horizon that is also a wall. Figures kneel below. Figures stand on a higher ground and watch them kneel. None of the figures have faces. The faces have been left blank on purpose.

You look at the painted falling lights for a long time before you understand they are still falling.`,

      description: `The Mural Chamber. Painted walls. A grey sky and figures with no faces. Light still falling.`,

      prophecy: {
        id: 'P7',
        title: 'What the Fire Knows',
        text: `Nothing built by hands lasts forever.
The fire knows this better than the hand.
Better than the keys.
Better than anything that lives
and names the falling light
and calls it beautiful.`
      },

      examineTargets: {
        'murals': 'Painted, not carved. The pigment is older than any tooled stone you have seen.',
        'sky': 'Wrong. There are too many lights and they are all falling at once.',
        'figures': 'No faces. The faces were left blank on purpose. Five of them stand below the falling lights, each in a different posture. The postures are precise — chosen, not random.',
        'lights': 'Falling in long grey lines. The lines move when you do not look at them.',
        'horizon': 'A wall. The painted sky ends at a painted wall. The world the murals remember had edges.',
        'symbol': 'In the lower-left corner of the largest mural, a small mark that resembles the script you have been finding. A circle with three lines through it. You count the lines twice. You begin to count them a third time and the lines look different. You are sure they have not moved.',
        'corner': 'A symbol there. A circle with three lines through it. The script is similar to what you have been reading. The meaning will not settle.',
        'first figure': 'The first figure, leftmost. Kneels with palms turned up to receive. The face is blank but the gesture is precise.',
        'second figure': 'The second figure. Stands with one hand raised, fingers spread. The other hand at the side. The blank face is turned toward whatever the raised hand is meant for.',
        'third figure': 'The third figure. Points downward with one hand, palm flat. The other hand is curled into a fist held against the chest.',
        'fourth figure': 'The fourth figure. Both hands cupped together at waist height, as if holding water that has not yet started to fall.',
        'fifth figure': 'The fifth figure, rightmost. Reaches upward with both hands open. The face is blank but the shoulders are taut with the reaching.',
        'lintel': 'Above the entry from the threshold hall, scratched into the stone in the same hand that marked the others: a single letter. **M**.'
      },

      exits: {
        north: { roomId: 'threshold_hall', label: 'Back to the hall' },
        east: { roomId: 'reliquary', label: 'East to a sealed door' },
        south: { roomId: 'echoes', label: 'South where sound carries strangely' }
      }
    },

    // ─── ROOM 27: RELIQUARY (P8, Cultist corruption gate) ───
    {
      id: 'reliquary',
      name: 'The Reliquary',
      zone: 'ruins1',
      descriptionFirst: `The room is a vault.

Not for treasure. For something that needed to be kept where it could not reach. The walls are plated in dull metal, riveted with care, riveted again where the first riveting did not hold. The floor is cold. The cold is not from the stone.

In the centre of the room, on a low pedestal, a shape under a cloth. The cloth has rotted to lace and the lace shows what the cloth was hiding: a relic. Bone-white. Wrong-shaped. Something has been added to it that should not have been added.

The room holds a presence the empty rooms do not. The relic is paying attention.

Words have been carved at the base of the pedestal in the same hand that carved the Etching, the Weeping Wall, the Scriptorium.`,

      description: `The Reliquary. Metal-plated vault. A bone-white relic on a pedestal that pays attention. Words carved at its base.`,

      prophecy: {
        id: 'P8',
        title: 'The Twelve Keys',
        text: `The hand could not enter what it built,
so it shaped twelve keys from the bones of forgotten gods —
twelve keys for doors that do not exist
against a fire that does not sleep.
Purpose but not breath.
They move as directed.
They speak as instructed.
They believe they choose.`
      },

      examineTargets: {
        'walls': 'Plated. Riveted. Re-riveted. Whatever is in this room was meant to stay here.',
        'pedestal': 'Stone. Lower than waist height. A circle of carved letters runs around its base.',
        'relic': 'Bone, you think. White. Twisted in a way bone does not twist on its own. Something has been added. You do not know what was added or by whom.',
        'cloth': 'Rotted to lace. The pattern of the rot is too even — it rotted from the inside.',
        'cold': 'Coming from the relic. The further you stand, the warmer the room becomes.'
      },

      hints: [
        'What is on the pedestal is older than the room. It is not safe to touch with empty hands. Something carried elsewhere may absorb what the relic gives.'
      ],

      actions: [
        {
          id: 'touch_relic',
          label: 'Reach for it',
          text: `You reach for the bone-white shape on the pedestal.

The cold finds your hand before your hand finds the relic. You hear something behind your teeth — a vocabulary not your own, the same grammar that spoke to you in the Mycelium Web. Louder here. Closer.

You forget your name. You forget you had one.`,
          requires: { not: { hasItem: 'decay_token' } },
          death: true
        },
        {
          id: 'touch_relic_protected',
          label: 'Reach for it',
          text: `You reach for the bone-white shape on the pedestal.

The cold finds your pocket first. Something there drinks it before it finds your hand. Whatever the relic was about to do passes through the dark thing in your pocket instead and goes nowhere — the dark thing has somewhere it has been keeping cold for a long time.

The room dims. The relic dims with it. You feel the attention let go of you.

You understand now what the bones were laid down for.`,
          requires: { hasItem: 'decay_token' },
          once: true,
          setFlag: { reliquary_survived: true },
          type: 'narration'
        }
      ],

      exits: {
        west: { roomId: 'mural_chamber', label: 'Back to the murals' },
        east: { roomId: 'hall_of_names', label: 'East to the hall of names' }
      }
    },

    // ─── ROOM 29: OFFERING NICHE ───
    {
      id: 'offering_niche',
      name: 'Offering Niche',
      zone: 'ruins1',
      descriptionFirst: `A small alcove off the collapsed archive.

The niche was cut for a single purpose: to hold a single thing. A shelf at chest height. A drain in the floor. A channel cut from the shelf to the drain, in case what was offered ran.

Nothing has been offered here in a long time. The drain is dry. The channel is dry. The shelf is dust.

Above the shelf, in a hand that wrote without care, a single line. Carved in haste, into stone that did not want to receive it.`,

      description: `The Offering Niche. A shelf, a channel, a drain. A line carved above the shelf in a careless hand.`,

      examineTargets: {
        'niche': 'Cut for one purpose. The proportions are exact.',
        'shelf': 'Dust. Whatever stood here has not stood here for centuries.',
        'channel': 'Cut from the shelf to a drain in the floor. The thing offered was meant to flow, eventually.',
        'drain': 'Dry. Whatever last ran through it left a stain that has darkened with time.',
        'line': 'Carved in haste. Two words: WHAT REMAINS. Whoever wrote it did not have the time to add anything else.'
      },

      actions: [
        {
          id: 'place_in_niche',
          label: 'Set something in the niche',
          text: `You set what you have on the shelf.

The dust shifts. Nothing else does. The drain remains dry. The carving above the shelf does not change. Whatever the niche was built to receive, the niche received what it received and would only know what it had received in its own time.

You take what you set down back into your hand. The shelf is dust again.`,
          once: false,
          setFlag: { niche_attempted: true },
          type: 'narration'
        }
      ],

      exits: {
        north: { roomId: 'collapsed_archive', label: 'Back to the archive' },
        east: { roomId: 'echoes', label: 'East where sound is doing something' }
      }
    },

    // ─── ROOM 30: ECHOES ───
    {
      id: 'echoes',
      name: 'Echoes',
      zone: 'ruins1',
      descriptionFirst: `The room has perfect acoustics. You realize this when the sound of your boot on the threshold returns to you four times.

The chamber is round. The walls curve evenly. The ceiling is a dome. There is nothing in the room except the geometry, and the geometry is enough.

You speak. The speaking comes back. Then it comes back again, slightly slower, slightly different. Then again. The fourth return is not your voice.

You stop speaking. The room takes a long time to stop speaking with you.`,

      description: `The Echoes. A round chamber with a dome. Your voice returns four times. The fourth return is not yours.`,

      examineTargets: {
        'walls': 'Smooth. Curved with care. The stone was chosen for how it carries sound.',
        'dome': 'A perfect arc. Whatever this room was built for was built around what the dome does.',
        'echoes': 'Yours. Yours. Yours. And then something that knows your voice better than you do.',
        'silence': 'It returns to the room slowly. The room has to agree to be silent again.'
      },

      textHandlers: [
        {
          id: 'echoes_speak',
          patterns: [/^say\b/i, /^speak\b/i, /^listen\b/i, /^name\b/i, /^call\b/i, /^shout\b/i],
          text: `You speak into the room.

The first echo is yours. The second is yours. The third is yours.

The fourth is something else. It speaks a sound that is almost a word — vorthen-li-aerix — and then the fourth echo collapses back into the third, which collapses back into yours, which fades.

You will not unhear that sound. Whether the sound was meant for you, you cannot say.`,
          once: false,
          setFlag: { false_name_heard: true },
          type: 'narration'
        }
      ],

      exits: {
        north: { roomId: 'mural_chamber', label: 'North to the murals' },
        west: { roomId: 'offering_niche', label: 'West to the niche' },
        east: { roomId: 'sealed_vault', label: 'East to the sealed vault' }
      }
    },

    // ─── ROOM 32: COSMOGONY WALL (P9) ───
    {
      id: 'cosmogony_wall',
      name: 'Cosmogony Wall',
      zone: 'ruins1',
      descriptionFirst: `The stairway from the Hall of Names ends at a wall.

The wall is a record. From floor to ceiling, the makers of this place set down what they thought the world was. A circle for the world they lived on. Smaller circles around it for the lights they could see. A larger circle around all of them — a wall painted around the whole arrangement, the kind of wall a child draws to keep a story inside.

At the centre of the largest circle, a brighter mark. Not a star. A different shape. The shape has been re-cut several times. The latest cutting is the shape of a keyhole.

Beneath the mural, a stairway descends further. The stone changes there. What lies below is not the same architecture.`,

      description: `The Cosmogony Wall. A circular cosmos cut into stone. A keyhole at the centre. A stairway down where the architecture changes.`,

      prophecy: {
        id: 'P9',
        title: 'The Light at the Centre',
        text: `The light at the centre is not a star.
It is a lock.
The breaking that made the pieces
made the thing that holds them.
The hand bled and the lock thinned.
The hand has bled.
The lock remembers.`
      },

      hints: [
        'The wall is a record. The carvers were writing for someone who would come after them. Look low — at the margin where the cosmology drawing ends and the bare stone begins.'
      ],

      examineTargets: {
        'wall': 'The work of people who tried to draw what they were inside of. The drawing is mostly correct. The drawing is mostly wrong.',
        'circles': 'Worlds, lights, the boundary that held them. The boundary is drawn thicker than the rest.',
        'centre': 'Cut and re-cut. Each cutting older than the last. The latest is a keyhole.',
        'keyhole': 'The shape is unmistakable. Whoever last carved it knew something the original makers did not.',
        'stairway': 'The steps below the wall are darker. The hand that cut them did not match the hand that cut these.',
        'lintel': 'Above the stairway down from the Hall of Names, scratched into the keystone where the cosmology drawing begins: a letter. **K**. Whoever marked it understood what was carved at the centre of the wall.',
        'frieze': `Along the lower margin of the cosmogony wall, just above where the floor begins, a continuous frieze of small carvings runs the width of the room. Seven figures, set in a line, left to right.

  1. A wave running across the stone.
  2. A face shown in profile, the eyes left blank.
  3. A tree with a hollow at its base.
  4. A network of fine threads radiating from a central knot.
  5. A single crystal, cleaved into a pair, the two halves still joined.
  6. A curtain or veil — parallel lines suggesting drift.
  7. A spiral, coiling inward.

Whoever set them here was telling another reader something. The reader was meant to know that these places, in this order, could be read.`,
        'symbols': 'Seven, in a line. Wave, eyeless face, tree, web, paired crystal, veil, spiral. The order matters. The order has been chosen.',
        'order': 'The frieze runs left to right. Seven things to find. Whoever follows is meant to find them.',
        'border': 'The lower margin of the wall, where the cosmology drawing ends and the bare stone begins. Seven small carvings run there in a row.'
      },

      vrethkaiTargets: {
        'frieze': `Seven carvings in the frieze, as the eye saw them. But there is an eighth. Set apart from the seven, beyond the right edge of the visible band, in the script the Immortal carved when the cycle was new — a single mark you could not see before.

It is a closed eye. It is a name held back. It is the witness that did not become the witnessed. Speak the seven and the eighth listens.`,
        'symbols': 'Seven and one. The seven are visible. The eighth is for those whose eyes have changed.',
        'border': 'The lower margin of the wall — and beyond the margin, an eighth carving the architects did not draw. The carvers who came after drew it without permission.',
        'eighth': 'A closed eye. The witness who did not become the witnessed.',
        'eye': 'A closed eye. Set apart from the seven. The architects did not draw it. The carvers who came after drew it without permission.'
      },

      // Visible only to a player whose eyes have already been changed —
      // i.e. one who completed Vreth'kai-with-Mind in a prior run. The
      // cipher is the same, but a touched reader sees a second layer in it
      // that points toward the chamber where the prophecy was first heard.
      changedWorldTargets: {
        'wall': `You read the wall again. You read it differently.

The cosmology drawing is not only a record of what the makers thought the world was. It is a map of where to take what they could not finish carrying. The keyhole at the centre is not the metaphor you took it for. It is a door, and the door is south of a room that has nothing in it, and the room is reached by holding what cannot be held.`,
        'centre': `Cut and re-cut. Each cutting older than the last. The latest is a keyhole.

You see now what the carvers could not say plainly. The lock at the centre is not on this wall. The lock is the chamber the wall describes. The mark here is its echo.`,
        'keyhole': `Drawn small, drawn deep. The shape stands for the chamber where the one who heard the prophecy first chose to sleep until it was almost finished. You are most of the way to that chamber by now. You have read more of this place than most readers ever do.

What the makers could not say in stone, because stone holds names too well: the chamber asks for a name that has never been used. Not a cycle's name. Not a god's. As new as he is old. Bring everything the wall asks you to bring. Stand inside the room that is not a room. Wait until it agrees. Then go down.`,
        'frieze': `You see the eighth carving now without straining for it. The eye that was closed is the eye of the one who sleeps. The seven taught the eye to count. The eighth taught it where to look once it could.`,
        'eighth': `The closed eye is his. He has been the witness who did not become the witnessed since before the first cycle finished naming itself. The carvers drew him here so that those who survived what you survived would know where to find him.`
      },

      exits: {
        up: { roomId: 'hall_of_names', label: 'Back up to the Hall' },
        down: { roomId: 'vitrified_entry', label: 'Descend into the deeper ruins' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — RUINS II: THE GLASS HALLS (Rooms 33-42)
    // Many cycles dead. Crystalline walls. The script moves.
    // ═══════════════════════════════════════════

    // ─── ROOM 33: VITRIFIED ENTRY ───
    {
      id: 'vitrified_entry',
      name: 'Vitrified Entry',
      zone: 'ruins2',
      descriptionFirst: `The stairway ends and the architecture changes.

The stone is glass. Not blown — fused. Whatever happened here happened hot enough to turn the walls into a single sheet of solidified light. The colour is wrong: deep green where the stone was iron-rich, milky white where it was not, threaded with veins of something darker that runs through the glass like vein through marble.

The air is dry. Older than dry. The kind of dry that makes you taste the inside of your own mouth.

There is no dust here. The dust did not survive whatever happened.

A corridor leads east. The wall there has writing on it. The writing moves.`,

      description: `The Vitrified Entry. Walls fused to glass. No dust. A corridor east where the writing on the wall moves.`,

      examineTargets: {
        'walls': 'Glass. Fused from stone. Whatever heat did this was beyond any fire you can imagine.',
        'glass': 'Streaked green and white and dark. The dark veins run deep into the wall and do not stop.',
        'air': 'Tastes of dust that has been dust for a very long time. Each breath leaves your mouth dry.',
        'writing': 'On the corridor wall east. It is not still. It is not pretending to be still.',
        'floor': 'Glass too. Smooth. Your boots squeak on it like wet stone.'
      },

      exits: {
        up: { roomId: 'cosmogony_wall', label: 'Back up to the cosmogony wall' },
        east: { roomId: 'mirror_corridor', label: 'East where the writing moves' }
      }
    },

    // ─── ROOM 34: MIRROR CORRIDOR (P10, Escape 7) ───
    {
      id: 'mirror_corridor',
      name: 'Mirror Corridor',
      zone: 'ruins2',
      descriptionFirst: `The corridor is lined with mirrors.

Not glass mirrors — the same fused stone, polished into reflective faces along both walls. There are seven of them on each side. Fourteen reflections of you walking, all of them slightly out of step with the original.

Six of the reflections are wrong.

One mirror shows a corridor that is not this corridor. Open. Lit. Sunlight falls down a stair you have never climbed but you know what it would feel like to climb it. The reflection in that mirror is not you. The reflection in that mirror is no one.

The script you saw at the entry continues here. The letters slide along the walls between mirrors, slow, deliberate, indifferent to your reading them.`,

      description: `The Mirror Corridor. Fourteen mirrors. One shows somewhere else. The script slides between them.`,

      prophecy: {
        id: 'P10',
        title: 'The First Word',
        text: `The doors were not built for walking.
They were built for speaking.
The first word spoken through them
was swallowed by the walls
and the sentence was never finished
and the doors have been waiting
for the rest of a message
that never came.`
      },

      examineTargets: {
        'mirrors': 'Stone polished to a mirror finish. Fourteen of them. Each shows you. Most of them show you doing something slightly different.',
        'reflections': 'They are not synchronized. Some are a step ahead. Some a step behind. One is gone entirely, and the corridor in its mirror is somewhere else.',
        'open mirror': 'A corridor opens behind it that is not this corridor. The sunlight is wrong for this depth. The sunlight is right.',
        'script': 'Letters that move. They are not finished writing what they are writing.',
        'wrong reflections': 'Six of them. They each move at slightly the wrong time. You stop moving and they stop. Most of them.',
        'lintel': 'Above the entry from the vitrified entry, scratched into the glass-stone in a hand that bled while it cut: a letter. **M**. The blood is long dry. The cut is permanent.'
      },

      actions: [
        {
          id: 'step_through_mirror',
          label: 'Walk into the reflection',
          text: `You walk into the mirror that is not a mirror.

The glass does not resist. The glass does not exist. You are in the corridor that the mirror was showing. Sunlight comes down a stair. The stair goes up.

You climb.`,
          setFlag: { escape_route: 'mirror_door' },
          moveTo: 'exit_surface'
        }
      ],

      exits: {
        west: { roomId: 'vitrified_entry', label: 'Back to the entry' },
        east: { roomId: 'resonance_choir', label: 'East where the corridor widens' },
        south: { roomId: 'gravity_well', label: 'South where the floor disagrees' }
      }
    },

    // ─── ROOM 35: RESONANCE CHOIR (P11) ───
    {
      id: 'resonance_choir',
      name: 'Resonance Choir',
      zone: 'ruins2',
      descriptionFirst: `The chamber is a throat.

Tall. Narrow. The walls rise into a vault that gathers every small sound and folds it into one. When you breathe, the room breathes with you. When you stop breathing, the room takes another breath without you. It has been breathing for a long time. It is patient about its breathing.

There are alcoves cut into the walls at intervals. Each alcove is the size of a person. Each alcove has been used. The stone inside is darker — greased dark, salt-dark, the dark of a place where shoulders have leaned and palms have rested for years.

A voice begins. It is not yours.`,

      description: `The Resonance Choir. A throat-shaped chamber. Body-sized alcoves stained where people stood. A voice that is not yours.`,

      prophecy: {
        id: 'P11',
        title: 'The Willing',
        text: `It wears the willing like a garment.
It walks in shapes borrowed from the dead.
Its voice is beautiful
because beauty is the door that opens without a key.
When the embers gather
the fire remembers its name.
When the fire remembers its name
the house
burns.`
      },

      onEnter: function(engine) {
        engine.flags.fire_name_syllable_willing = true;
      },

      examineTargets: {
        'walls': 'Built to carry sound. The shape is exact.',
        'alcoves': 'Cut for standing. The inside of each is darker where someone used to stand. Hundreds of someones. Hundreds of years.',
        'voice': 'It does not come from anywhere in particular. It comes from where the room is shaped to send it.',
        'breath': 'The room breathes. The room has always breathed. You can stop breathing for a while and the room will breathe for you.'
      },

      exits: {
        west: { roomId: 'mirror_corridor', label: 'Back to the mirrors' },
        east: { roomId: 'crucible', label: 'East where the air burns' },
        south: { roomId: 'living_script', label: 'South where letters crawl' }
      }
    },

    // ─── ROOM 36: GRAVITY WELL (Escape 8 with Crystal Organ) ───
    {
      id: 'gravity_well',
      name: 'Gravity Well',
      zone: 'ruins2',
      descriptionFirst: `The chamber is round and the chamber is wrong.

The floor curves. Not by accident — by design. The whole room is a bowl of glass-stone, and the bowl draws everything toward its centre. Water would pool there. Sound pools there. You can feel the pull of the centre on your feet, gentle but insistent.

There is no water. There is, at the centre, an indentation. A circle the diameter of a person. The glass beneath the circle is cracked outward, as if something pushed up from below and did not quite break through.

You suspect that down is not the only direction this well allows. The Inverted Grove taught you something about gravity. You remember the lesson.`,

      description: `The Gravity Well. A bowl of glass-stone pulling toward its centre. A cracked circle at the bottom where something pushed up.`,

      examineTargets: {
        'floor': 'Curved. The pull is real but slow. Standing still, you drift.',
        'centre': 'The indentation is body-shaped. The cracks point upward, away from the floor.',
        'cracks': 'They go up, not down. Whatever broke through here broke from beneath, into the room.',
        'pull': 'Gentle. Insistent. It does not need you to fall fast. It only needs you to keep falling.'
      },

      actions: [
        {
          id: 'invert_well',
          label: 'Sing the Crystal Organ tone into the centre',
          requires: { hasAllFlags: ['crystal_organ_attuned', 'gravity_lesson_learned'] },
          text: `You stand in the centre and let the tone you remember from the organ leave your mouth.

The room hears it. The room agrees with it.

The bowl inverts. The pull reverses without warning. Your feet leave the floor and you are falling — upward — through cracks that open as you reach them. The glass-stone parts. The world above parts. You fall into the open and the sky catches you.

The sky is grey. The sky is enough.`,
          setFlag: { escape_route: 'gravity_inversion' },
          moveTo: 'exit_surface'
        }
      ],

      exits: {
        north: { roomId: 'mirror_corridor', label: 'Back up to the mirrors' },
        east: { roomId: 'the_choosing', label: 'East where the air thins' }
      }
    },

    // ─── ROOM 37: THE CRUCIBLE (Death risk, Cultist listen choice) ───
    {
      id: 'crucible',
      name: 'The Crucible',
      zone: 'ruins2',
      descriptionFirst: `The chamber is hot.

Not the temperature of fire — the memory of it. The walls remember. They give off the heat of something that burned here long enough to teach the stone the shape of burning. There is no flame now. There is only the residue of a flame that did its work and left.

In the centre, a basin of fused glass holds a single point of light. The light does not flicker. The light is patient.

The light is speaking to you. Not in words. In a low pressure behind your eyes, a word almost remembered, the silence between two breaths held a beat too long.

You can leave. You can stay and listen.`,

      description: `The Crucible. A chamber that remembers fire. A basin holds a single steady light. The light is speaking.`,

      examineTargets: {
        'walls': 'Hot. Not from anything burning now. From what burned here.',
        'basin': 'Fused glass. Cradling something. The cradle has held what it holds for centuries.',
        'light': 'A point. Steady. The colour is not a colour you have a name for.',
        'heat': 'Coming from the walls. The walls remember. The walls have been remembering for a long time.',
        'lintel': 'Above the entry from the choir, scratched into glass that should not have taken a scratch: a letter. **F**. The mark warps the heat that passes through it. Whoever made it knew something about glass and fire that the architects did not.'
      },

      timer: {
        turns: 6,
        onExpire: 'death',
        warningOnEnter: 'The light is speaking. The longer you stay the more grammar it borrows from your bones.',
        warning: 'You can taste it now. The light is in your throat.',
        warningAt: 2,
        deathText: `The light wore the face of every wound you ever carried. Then it took your face too.

You forget your name. You forget you had one.`
      },

      actions: [
        {
          id: 'listen',
          label: 'Stay',
          text: `You stand in the heat and you do not leave.

The light does not move. The light teaches.

What the light gives is permission. Not a sound — what is needed is elsewhere. What the light gives is the right to gather what is needed and bring it back.

You leave when you are ready to leave. The light does not stop you. The light has what it needed.`,
          once: true,
          setFlag: { crucible_listened: true },
          type: 'narration'
        },
        {
          id: 'walk_through_fire',
          label: 'Step into the basin',
          requires: { hasFlag: 'fire_name_spoken' },
          text: `You step into the basin.

The light does not burn you. The light has agreed not to. You walk through what should kill you and the heat parts around you, the colour parts around you, the residue of every burning ever held by these walls parts around you. The room knows the name now. The room is on your side.

There is a passage in the wall behind the basin you did not see until now. The passage was always there. The passage will let you through.`,
          moveTo: 'cultist_emergence'
        }
      ],

      exits: {
        west: { roomId: 'resonance_choir', label: 'Back to the choir' },
        east: { roomId: 'crystal_organ', label: 'East where stone sings' }
      }
    },

    // ─── ROOM 38: LIVING SCRIPT (P12) ───
    {
      id: 'living_script',
      name: 'Living Script',
      zone: 'ruins2',
      descriptionFirst: `The room is a wall and the wall is the room.

A single chamber, not large. Every surface — floor, walls, ceiling — is covered in letters. The letters are moving. Not flowing. Crawling. Each letter takes its time. Each letter chooses where to go next. They have been choosing for a long time and they have not finished what they are spelling.

The script is the same that was at the Etching, the Weeping Wall, the Scriptorium. Older here. The hand that started this passage has been dead for cycles.

The hand has not stopped writing.`,

      description: `Living Script. Letters that crawl across every surface. The hand that began them is long dead. The hand has not stopped writing.`,

      prophecy: {
        id: 'P12',
        title: 'The Twelve Standing',
        text: `Twelve stood at the beginning. Twelve stand still.
Standing is not winning.
One watches the wind and wonders if the walls should fall.
One watches the fire and wants a weapon large enough.
One watches the turning and is tired
beyond any word the living have for tired.
They were made to hold.
Not to ask whether holding is enough.`
      },

      hints: [
        'The letters are not random. If you watch a single section long enough, the moving will stop. There is something held still on the eastern wall worth reading.'
      ],

      examineTargets: {
        'letters': 'Each one alive. Each one slow. Their motion is deliberate. If you watch a single section long enough, the moving letters slow and arrange themselves into a phrase, holding the shape long enough to be read before they begin moving again.',
        'walls': 'Surface. Every surface. The script does not care about geometry.',
        'ceiling': 'Letters fall from it slow as rain that has decided not to land yet.',
        'floor': 'You walk on letters. The letters move out of your way.',
        'riddle': `On the eastern wall, the letters slow, arrange themselves, and hold:

    *I am older than every cycle that has tried to forget me.
    I hold what the forgetting was for.
    I am the place where two doors meet
    but neither was built.
    I am the only word that has not lied.

    Speak my name.*

The letters hold the shape until you have read them, and then begin moving again — but the riddle stays with you.`,
        'phrase': 'Watch the eastern wall. The letters slow, settle into the shape of a riddle, hold for as long as you read, and begin moving again.',
        'lintel': 'Above the entry from the south, scratched into glass that should not have taken a scratch: a letter. **L**.'
      },

      textHandlers: [
        {
          id: 'speak_riddle_answer',
          patterns: [/^(?:say|speak|name|answer|threshold)\s*threshold?\b/i, /^threshold$/i],
          requires: { not: { hasFlag: 'riddle_answered' } },
          text: `You speak the word into the room.

The letters on the eastern wall do not slow this time. They part. The wall behind them shows what was always there — a doorway-shape in the glass, narrow and tall, opening on a chamber the architects sealed and the script has been hiding for cycles.

You can step through.`,
          once: true,
          setFlag: { riddle_answered: true },
          type: 'narration'
        }
      ],

      exits: {
        north: { roomId: 'resonance_choir', label: 'Back to the choir' },
        east: { roomId: 'crystal_organ', label: 'East to the organ' },
        south: { roomId: 'membrane', label: 'South where the air thins further' },
        west: {
          roomId: 'between_doors',
          label: 'Through the doorway-shape in the glass',
          requires: { hasFlag: 'riddle_answered' }
        }
      }
    },

    // ─── ROOM: BETWEEN DOORS (riddle reward — hidden chamber off Living Script) ───
    {
      id: 'between_doors',
      name: 'Between Doors',
      zone: 'ruins2',
      descriptionFirst: `The chamber is small. The walls are not glass and not stone. The walls are the place where two materials would have agreed if they had ever met.

In the centre of the floor, on a shelf grown from whatever the floor is, sits something the room was built to hold.

A clay lantern. Older than the lantern at the echoing pit. Empty of oil but intact. The shape of it is unmistakable — a hand-lantern of the kind your people have not made in any cycle the prophecy remembers.

Above it, in the script that moves outside, a single phrase has been held still:

*The witness who carries the light does not need to speak the name.*`,

      description: `Between Doors. A small chamber. A shelf with a clay lantern on it. A held phrase above.`,

      items: ['lantern'],

      examineTargets: {
        'walls': 'Neither glass nor stone. The room is the threshold itself.',
        'shelf': 'Grown, not built. The lantern fits it exactly.',
        'lantern': 'A hand-lantern. Empty of oil. Intact.',
        'phrase': '*The witness who carries the light does not need to speak the name.*',
        'lintel': 'No lintel. The room has no entry — only the place where the entry agreed to exist.'
      },

      exits: {
        east: { roomId: 'living_script', label: 'Back through the place where the doorway agreed to exist' }
      }
    },

    // ─── ROOM 39: CRYSTAL ORGAN (Sequence puzzle + Harmonic for Gravity Well) ───
    {
      id: 'crystal_organ',
      name: 'Crystal Organ',
      zone: 'ruins2',
      descriptionFirst: `Pillars of crystal rise from floor to ceiling — seven of them, seven in a circle. Each one a different height, each cut to a different bevel. Each one carved at chest-height with a figure in a precise posture. Above each figure, a single letter has been etched into the crystal — A through G, around the ring.

The air around the pillars hums.

You step inside the circle and the hum changes.

The pillars play themselves when you breathe. Each note is a tone they have agreed to make in your presence. They do not perform. They report. The notes are not random — they are the shape of the room you are in, sung back at you.

You can play them in an order. You can make a song. The pillars will only finish the song they recognise. The order matters.`,

      description: `The Crystal Organ. Seven crystal pillars in a circle, lettered A through G. Each carved with a posture. The pillars hum until you give them an order to follow.`,

      hints: [
        'The pillars know an order. The order is not the alphabet. The shape of it is shown elsewhere — in the postures of the figures painted on a wall in the floors above.'
      ],

      examineTargets: {
        'pillars': 'Seven. Each different. Each carved with a different posture at chest height. The order they are arranged in is not the order their letters suggest.',
        'hum': 'Constant. The room hums even when no one is breathing in it.',
        'notes': 'They report what the room is. They will let you change what the room is — but only in an order the room agrees with.',
        'circle': 'The pattern of the floor inside the pillars is faceted. It would catch a falling tone.',
        'pillar a': 'A column of crystal, taller than you. Marked with the letter **A** above the carving. The carving shows a figure with one hand raised, fingers spread, the other hand at the side.',
        'pillar b': 'A column of crystal. Marked **B**. Carved with a figure cupping both hands together at waist height.',
        'pillar c': 'Marked **C**. Carved with a figure with arms crossed over the chest. Both hands closed.',
        'pillar d': 'Marked **D**. Carved with a kneeling figure, palms turned up to receive.',
        'pillar e': 'Marked **E**. Carved with a figure standing upright, head bowed, hands at the sides.',
        'pillar f': 'Marked **F**. Carved with a figure pointing downward, palm flat. The other hand is curled into a fist at the chest.',
        'pillar g': 'Marked **G**. Carved with a figure reaching upward, both hands open.',
        'lintel': 'Above the entry from the west — between the Crucible and this room — a letter has been cut into the crystal of the doorframe. **O**. The cut is recent. The crystal has not closed it.'
      },

      textHandlers: [
        {
          id: 'play_correct_sequence',
          patterns: [/^play\s+d\s*a\s*f\s*b\s*g\s*$/i],
          text: `You touch the pillars in the order you spoke. D. A. F. B. G.

The first pillar holds its tone. The second answers. The third. The fourth. The fifth folds the song back into itself, and the song the song was hiding inside comes through.

You will remember this. The room will remember it too.`,
          once: true,
          setFlag: { crystal_organ_attuned: true },
          type: 'narration'
        },
        {
          id: 'play_wrong_sequence',
          patterns: [/^play\s+[a-g\s]+$/i],
          text: `You touch the pillars in the order you spoke.

The room receives the tones and lets them fall. The order was not the order. The pillars hum back to where they were before you spoke.`,
          once: false,
          type: 'narration'
        }
      ],

      actions: [
        {
          id: 'sing_seal_song',
          label: 'Sing back what the room sang to you, but differently',
          requires: { hasIdentity: 'warden', hasFlag: 'crystal_organ_attuned' },
          text: `You take the song the room taught you and you give it back to the pillars in a different shape.

The pillars do not protest. The pillars amplify. What you sing is not the song they showed you — it is the song the song was hiding inside.

The forest will know what you have continued.`,
          once: true,
          setFlag: { seal_song: true },
          type: 'narration'
        }
      ],

      exits: {
        west: { roomId: 'crucible', label: 'Back to the crucible' },
        north: { roomId: 'living_script', label: 'North to the living script' }
      }
    },

    // ─── ROOM 40: THE CHOOSING (Seeker identity) ───
    {
      id: 'the_choosing',
      name: 'The Choosing',
      zone: 'ruins2',
      descriptionFirst: `A chamber with three openings.

The floor of the chamber is split into three sections, each one descending toward a different doorway. The doorways are unmarked, but the room is. Above the entrance behind you, where you came in, the carving says nothing — your way out is your own.

Above the leftmost door: a hand turning a key.
Above the centre door: a face with no eyes.
Above the rightmost door: an open palm.

Whoever built this chamber wanted everyone who entered to make a decision before they left. The decision was the point of the room.`,

      description: `The Choosing. Three doors. Three carvings — a turning key, an eyeless face, an open palm. The decision is the room.`,

      examineTargets: {
        'left door': 'A hand turns a key. The key is not in any lock. The hand is alone.',
        'centre door': 'A face. No eyes. The mouth is closed. The mouth is the face.',
        'right door': 'An open palm. Empty. The fingers spread.',
        'floor': 'Three sections. Each tilts toward its door. You will not walk back the way you came.',
        'carvings': 'Older than the rest of Ruins II. Whoever made this chamber made it before the glass.',
        'lintel': 'Above the entry from the north, scratched into the stone in a hand newer than the carvings: a single letter. **I**.',
        'face': 'The carving above the centre door. No eyes. The looking does not stop where eyes stop.'
      },

      actions: [
        {
          id: 'choose_seeker',
          label: 'Pass under the face',
          requires: { noIdentity: true },
          text: `You walk under the carving of the face that has no eyes.

The room behind you is silent. The room ahead is silent. There is no sound at all for a long moment, and in that moment you understand what the carving meant. The face has no eyes because the looking is not the point. The looking does not stop where eyes stop.

When you step through, you understand you have agreed to look at things that do not want to be seen.`,
          once: true,
          setIdentity: 'seeker',
          type: 'narration'
        },
        {
          id: 'recognize_other_path_seeker',
          label: 'Stand between the three doors',
          requires: { hasFlag: 'identity_chosen', not: { hasIdentity: 'seeker' } },
          text: `You stand at the threshold of the three doors.

The choosing was done elsewhere. The doors will let you through anyway. The eyeless face does not stop you. It does not invite you either.`,
          once: true,
          type: 'narration'
        }
      ],

      exits: {
        west: { roomId: 'gravity_well', label: 'Back to the well' },
        south: { roomId: 'membrane', label: 'South through the eyeless face' }
      }
    },

    // ─── ROOM 41: THE MEMBRANE (P13) ───
    {
      id: 'membrane',
      name: 'The Membrane',
      zone: 'ruins2',
      descriptionFirst: `Something here is wrong that none of the previous rooms were.

The walls are not walls. They are a thinness — glass-stone stretched until it almost lets through. Press a hand against them and the wall gives, slow, like skin under steady pressure. It does not break. It does not tear. It accepts the press and returns to its shape when you let go.

What is on the other side does not show.

In the floor, set into a band of darker glass, words have been etched in the same hand that wrote at the Etching. The words are clearer here than anywhere else.`,

      description: `The Membrane. Walls thin enough to push through. They accept and recover. Words etched in the floor.`,

      prophecy: {
        id: 'P13',
        title: 'The Door He Forgot',
        text: `They do not know
about the door the hand forgot to close,
or the two who walked through it
with stolen blood on their teeth
and the truth in their throats,
neither key nor ember,
kneeling before nothing.`
      },

      examineTargets: {
        'walls': 'Thin. They give. They do not yield.',
        'thinness': 'Where the wall is thinnest, the air on the other side is colder. You can feel it through the stone.',
        'words': 'The hand that etched these is the same. The words are clearer here than anywhere.',
        'floor': 'Glass with a band of darker glass running through. The band is cooler than the rest.'
      },

      exits: {
        north: { roomId: 'living_script', label: 'Back to the living script' },
        east: { roomId: 'the_choosing', label: 'East to the chamber of choice' },
        south: { roomId: 'thinning', label: 'South where the wall is thinnest' }
      }
    },

    // ─── ROOM 42: THE THINNING ───
    {
      id: 'thinning',
      name: 'The Thinning',
      zone: 'ruins2',
      descriptionFirst: `The wall here is no longer a wall.

The thinness from the previous chamber has reached its limit. The glass-stone is nearly gone — translucent, then transparent, then absent. You can step through the place where the wall was. On the other side, the stone is different. Not glass. Not carved. Grown.

The architecture below has nothing in common with the architecture above.

Whatever lies beneath was not built. It was given a shape and the shape held.`,

      description: `The Thinning. The wall ends here. Below: stone that was grown, not built.`,

      examineTargets: {
        'wall': 'Gone. The remainder of it is so thin you can see through it.',
        'stone below': 'Different. Not the glass of Ruins II. Something organic that hardened into rock.',
        'shape': 'The architecture is wrong. The angles are not angles. The walls are not walls. They are something that decided to be walls.'
      },

      exits: {
        north: { roomId: 'membrane', label: 'Back to the Membrane' },
        down: { roomId: 'pulse', label: 'Step through the thinning, down into the grown stone' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — RUINS III: THE BREATHING STONE (Rooms 43-50)
    // First cycle. Not built. Grown. The walls pulse.
    // ═══════════════════════════════════════════

    // ─── ROOM 43: THE PULSE ───
    {
      id: 'pulse',
      name: 'The Pulse',
      zone: 'ruins3',
      descriptionFirst: `You step from the Thinning onto stone that pulses.

Not a tremor. Not a vibration. A slow, deep, regular movement of the floor itself, as if you are standing on the ribcage of something asleep. The walls move with the same rhythm. The ceiling, faint, moves too.

The light here is different — not bioluminescent, not crystal, not flame. The walls themselves give off a low warmth that has the colour of the inside of an eye when the eye is closed against the sun.

The air smells of breath. Wet. Warm. The space between an inhale and the answering exhale, held too long.`,

      description: `The Pulse. Stone that breathes. The walls move with you. The light is the colour of a closed eye.`,

      examineTargets: {
        'floor': 'Slow rise. Slow fall. Your boots flex with the breath.',
        'walls': 'The same. The chamber is one organism breathing in three places.',
        'light': 'It comes from the stone. The stone is warm. The stone has been warm for a long time.',
        'rhythm': 'Slow. Slower than yours. You will need to match it eventually.',
        'lintel': 'Above where the stone-and-bone of the Thinning gives way to the breathing wall of this room, a letter has been pressed into the warm matter while it was still soft enough to take a mark. **P**.'
      },

      vrethkaiTargets: {
        'rhythm': 'You match the breath without trying. Three counts in, four counts out, the room and your chest agreeing without consultation. The pulse is the cycle\'s pulse. You can feel where it slows.',
        'walls': 'Older than flesh. Where the bone-vault stops, this begins — soft, warm, slow.',
        'breath': 'Three in. Four out. The cycle\'s lung. You will know how to use the rhythm when the rhythm asks you to.'
      },

      exits: {
        up: { roomId: 'thinning', label: 'Back up through the thinning' },
        south: { roomId: 'bone_cathedral', label: 'South toward something larger that breathes' }
      },

      actions: [
        {
          id: 'ride_exhale',
          label: 'Step into the rising breath when the room exhales',
          requires: { hasAnyOfFlags: ['crystal_organ_attuned', 'pulse_rhythm_learned', 'vrethkai_with_mind'] },
          text: `You wait. Three counts in. Four counts out. On the fourth count, the room exhales — and the warmth pushes upward, and you let it carry you.

The breath of the cycle's lung lifts you through a bio-shaft you did not see before. It carries you fast. The dark thins. The grey light grows.

You emerge above ground, breathing what the room breathed for you.`,
          setFlag: { escape_route: 'breath_release' },
          moveTo: 'exit_surface'
        },
        {
          id: 'learn_rhythm',
          label: 'Stand still and study the breath',
          requires: { not: { hasFlag: 'pulse_rhythm_learned' } },
          once: true,
          text: `You stand still and let the room breathe around you for a long time.

Three counts in. Four counts out. You start to feel where the warmth gathers on the exhale — there is a place in this chamber where the breath lifts. If you stood there at the moment of the fourth count out, the breath would carry you.

You will remember this rhythm. You can ride the breath now.`,
          setFlag: { pulse_rhythm_learned: true }
        }
      ]
    },

    // ─── ROOM 44: BONE CATHEDRAL (P14 — The Hunger) ───
    {
      id: 'bone_cathedral',
      name: 'Bone Cathedral',
      zone: 'ruins3',
      descriptionFirst: `The chamber rises into a vault made of bone.

Not bone laid in by hands — bone grown. Ribs that arch overhead, vertebrae that columned themselves into pillars, a sternum that has become a wall. The proportions are not human. The proportions are not anything you have a frame for. The thing that grew this place wore a body and the body wore many bodies before it.

At the centre, beneath the vault, an inscription. Cut into a single rib that has been smoothed and prepared. The hand that cut it is the same hand that cut the Etching, the Weeping Wall. Older here. The hand was old when it cut this. The hand had been writing for a long time.`,

      description: `The Bone Cathedral. A vault grown from bone too large to be a single creature's. An inscription on a smoothed rib.`,

      prophecy: {
        id: 'P14',
        title: 'The Hunger',
        text: `The smallest ember dreams of joining.
The largest ember remembers being whole.
Between the dreaming and the remembering
the hunger lives,
the only thing in the house
that has never once forgotten what it is.`
      },

      onEnter: function(engine) {
        engine.flags.fire_name_syllable_hunger = true;
      },

      examineTargets: {
        'vault': 'Bone. Grown into vaulting. The bones are larger than any one body you can imagine.',
        'pillars': 'Vertebrae fused. Each one taller than you. The spinal column would have stretched for miles.',
        'rib': 'Smoothed for inscription. The hand that prepared it knew how bone takes a cut.',
        'inscription': 'Cut by the same hand that wrote at the Etching. The hand has been writing through every cycle.',
        'wall': 'A sternum. The chest that held it would not have fit in any cycle\'s mythology.',
        'lintel': 'Above the entry from the pulse, set into the bone where the rib-arch begins: a letter. **B**. The bone has tried to grow over the cut and the cut has won.'
      },

      vrethkaiTargets: {
        'vault': 'The bones are written on. The whole vault is one inscription. You see it now — it is the body of the first thing that walked the cycle, laid down to be remembered, the words running across every rib and every fused vertebra. You know what the cycle was for. You know what was given so the cycle could begin. The Immortal who set the false star was not alone. He had a body, once. The body refused. The vault is what the refusal became.',
        'inscription': 'The inscription is the whole room. Every bone speaks. The sentence is the cycle itself.',
        'rib': 'It is not a single rib. It is one syllable of a sentence the dead first-thing has been saying since the cycle began.',
        'wall': 'Sternum. The chest that held the heart that fed the false star. You see it now.'
      },

      exits: {
        north: { roomId: 'pulse', label: 'Back to the Pulse' },
        east: { roomId: 'throat', label: 'East where the cathedral narrows' },
        south: { roomId: 'first_word', label: 'South to a chamber that listens' }
      }
    },

    // ─── ROOM 45: THE THROAT (Vreth'kai lair, transformation gate) ───
    {
      id: 'throat',
      name: 'The Throat',
      zone: 'ruins3',
      descriptionFirst: `The cathedral narrows into a passage that swallows.

The walls close in until your shoulders almost brush them. The bone underfoot is wet. The light dims. The breath that has been moving the stone moves harder here, faster. You are inside the place where the breath is generated.

You hear them before you see them.

Long. Pale. Wrong in the joints. They move through the dark on the other side of the throat — wet, single-file, fast, the scrape of chitin on bone. They have not noticed you yet. They will.

This is where the cycle keeps its mistakes. This is where being caught becomes something you cannot recover from.`,

      description: `The Throat. The bone passage narrows. Pale things move on the other side. You can hear them. They have not seen you yet.`,

      examineTargets: {
        'walls': 'Wet. Bone, but soft at the surface. The passage is alive.',
        'them': 'You cannot see them clearly. You do not want to. The pale and the wrong and the joints that should not bend.',
        'breath': 'Wet at the inhale. Dry at the exhale. The throat is a horn. The horn is alive. The horn is hungry.',
        'dark': 'Past the narrows. They are in the dark. They are the dark.',
        'lintel': 'Above the entry from the cathedral, where the bone has been worn smooth by the passage of bodies, no letter is carved. The mappers who marked the rest of this place did not mark this room. They did not finish. They did not return.'
      },

      hints: [
        'What was carved into the bone of this room is meant for those who have changed. If you are still yourself, you will not see it. If you are not yourself, the bone will show its writing.'
      ],

      vrethkaiTargets: {
        'walls': 'The bone is not bare. There is writing in it — script that was not visible to the eyes you used to have, burned into the bone in the same hand that carved the cosmogony wall. The script reads, plainly: a word. The word is the witness. Speak it and the dark will let you go.',
        'carving': 'There is writing in the bone. The same hand. The word is the witness. Speak it.',
        'word': 'The bone shows it: WITNESS. Speak it now and the dark steps aside.',
        'script': 'In the bone of the throat: WITNESS. The dark wrote it for those it did not finish taking.',
        'them': 'You see them now without seeing them. They are smaller than they sounded. They are afraid of what you have become — only for as long as the change is fresh.'
      },

      timer: {
        turns: 4,
        onExpire: 'death',
        warningOnEnter: 'Something on the other side of the dark stops moving. Something on the other side of the dark turns its head.',
        warning: 'They have noticed you. The breath of the throat has changed.',
        warningAt: 2,
        deathText: `They came through the dark in a single rush, and the dark came with them.

You forget your name. You forget you had one.`
      },

      actions: [
        {
          id: 'be_caught',
          label: 'Stand',
          requires: {
            hasFlag: 'identity_chosen',
            hasRelic: 'shard_forest',
            hasFragment: 'P14',
            minFragments: 10
          },
          text: `You do not run.

The dark comes for you and you let it come.

The change begins where the cold finds your skin first. You feel your jaw rearrange. Your teeth find positions they did not know they had. The air tastes different. The light tastes different. The light has a taste now.

The shape is closing around the place your name lived.

If you have anything left to say with the mouth you used to have, say it now.`,
          once: true,
          setFlag: { vrethkai_transformation: true },
          type: 'narration'
        }
      ],

      exits: {
        west: { roomId: 'bone_cathedral', label: 'Back through the cathedral (quickly)' }
      }
    },

    // ─── ROOM 46: THE WOMB (P15, hidden altar for Cultist) ───
    {
      id: 'womb',
      name: 'The Womb',
      zone: 'ruins3',
      descriptionFirst: `The chamber is round and the chamber is warm.

The walls are wet. The wetness is not water. It films your fingers when you touch it and beads slow. It is the inside of something. The cathedral above was the dead skin of it. This is where it still lives.

A bowl rises from the centre of the floor — grown from the floor, not placed. The bowl is the size of a small shrine. It has held something. It is waiting to hold something again.

If you have a name to speak, this is the room that will hear it spoken.`,

      description: `The Womb. A round, warm chamber. A grown bowl at the centre. A room that listens for names.`,

      prophecy: {
        id: 'P15',
        title: 'What Falls',
        text: `What falls is not light.
It is the fire reaching through the thinning places,
wearing brightness like a mask.
Count them.
Each season there are more.
Each season the lock forgets a little more
of what it was made to do.`
      },

      examineTargets: {
        'walls': 'Damp. Warm. The room is the inside of something that grew.',
        'bowl': 'Grown from the floor. The interior is darker than the surrounding stone. Something has rested here.',
        'air': 'Heavy with what the air should not be heavy with.',
        'altar': 'You did not call it that until you were close enough to know what it was.'
      },

      hints: [
        'The bowl waits for a name. The name is not one word — it is three syllables, gathered from elsewhere. You will know when you have all three.'
      ],

      textHandlers: [
        {
          id: 'speak_fire_name',
          patterns: [/^say\s+/i, /^speak\s+/i, /^name\s+/i],
          text: `You speak the syllables you have gathered. The patient one from Mother Tangle. The willing one from the Resonance Choir. The hungry one from the Bone Cathedral.

The bowl receives them. The room receives them. The room agrees.

The altar opens. The fire knows you now. The fire is willing.

(Cultist path advanced — the Crucible will let you walk through.)`,
          requires: {
            hasIdentity: 'seeker',
            hasAllFlags: [
              'reliquary_survived',
              'crucible_listened',
              'fire_name_syllable_patient',
              'fire_name_syllable_willing',
              'fire_name_syllable_hunger'
            ],
            minFragments: 15
          },
          once: true,
          setFlag: { fire_name_spoken: true },
          type: 'narration'
        }
      ],

      exits: {
        north: { roomId: 'first_word', label: 'North to a chamber that hears' },
        east: { roomId: 'wound_eternal', label: 'East to a wound that will not close' }
      }
    },

    // ─── ROOM 47: THE WOUND ETERNAL ───
    {
      id: 'wound_eternal',
      name: 'The Wound Eternal',
      zone: 'ruins3',
      descriptionFirst: `A tear in the wall.

The wall was bone, and the tear was made by something that broke out of the bone, not into it. The edges have not healed. They will not heal. The wall has not yet decided whether to forgive what was done to it.

Through the tear, a passage descends. The passage is the inside of an artery. The passage knows it is being walked through, and the passage tolerates the walking.

You can hear something pumping further down. Not a heart. The thing that a heart was a copy of.`,

      description: `The Wound Eternal. A tear in bone that will not heal. A passage like an artery descending toward something pumping.`,

      examineTargets: {
        'tear': 'The bone broke outward. Whatever was inside left in a hurry, and what is left has not finished objecting.',
        'edges': 'Sharp where they were cut. Soft where they were torn. Both kinds of pain remembered in the same wall.',
        'passage': 'It accepts you. It does not welcome you.',
        'pumping': 'Far below. Not your heart. Not anyone\'s. The thing that hearts learned from.'
      },

      onEnter: function(engine) {
        // After the heart's pumping has been quieted (third shard taken), the
        // wound's bleeding stops. A passage that was always there shows itself.
        if (engine.flags.heart_quieted && !engine.flags.wound_eternal_opened) {
          engine.flags.wound_eternal_opened = true;
          engine._emit('output', `\nThe pumping below has stopped. The wall is dry.\n\nThe wound has set, and where it set, the bone shows a way upward. Not a new passage — an old one, only visible now that the bleeding has stopped.`, 'narration');
        }
      },

      exits: {
        west: { roomId: 'womb', label: 'Back to the Womb' },
        down: { roomId: 'heart_chamber', label: 'Down toward the pumping' },
        up: {
          roomId: 'threshold_hall',
          label: 'Up where the bone has set',
          requires: { hasFlag: 'wound_eternal_opened' }
        }
      }
    },

    // ─── ROOM 48: THE FIRST WORD (P16) ───
    {
      id: 'first_word',
      name: 'The First Word',
      zone: 'ruins3',
      descriptionFirst: `A chamber that listens.

The walls curve inward into something like the shape of an ear, if an ear could be the size of a room. The bone is thin here. The bone is paying attention.

Set into the wall at the focal point of the listening, a single carved word. The carving is older than any other inscription you have found. The hand that made it was not the hand that wrote at the Etching. The hand that made it was the hand that wrote at the Etching. You cannot tell. The carving is too old for the same person to have made it. The carving is too consistent for someone else to have made it.

The word, in a script you have learned to read on the way down, says: *help.*`,

      description: `The First Word. A chamber shaped like an ear. A single word carved at the listening point. The word is "help."`,

      prophecy: {
        id: 'P16',
        title: 'Help',
        text: `The doors can still speak.
They have always been able to speak.
The first word was help.
The sentence was never finished
because the hand that built the walls
built them too well
and could not hear its own house
begging.`
      },

      examineTargets: {
        'walls': 'Curved into a listening. The room hears.',
        'word': 'The script you have learned on the way down. The word is help. The sentence was never finished.',
        'hand': 'The same. Not the same. The carving is too old for resolution.',
        'silence': 'The chamber is meant for one word. The word has been waiting to be answered.'
      },

      exits: {
        north: { roomId: 'bone_cathedral', label: 'Back to the cathedral' },
        south: { roomId: 'womb', label: 'South to the Womb' }
      }
    },

    // ─── ROOM 49: HEART CHAMBER (Relic Shard 3, P18) ───
    {
      id: 'heart_chamber',
      name: 'Heart Chamber',
      zone: 'ruins3',
      descriptionFirst: `The chamber pumps.

Not metaphorically. The walls expand and contract on a cycle longer than your breath, faster than the breath of the cathedral above. The light here is red. The red comes from the walls. The walls are full.

At the centre, set into a depression in the bone-floor, a fragment. The third you have seen. Pale. Pulsing in time with the room — or the room pulsing in time with it. You cannot tell which leads.

The fragment is the size of two fists. The depression is exactly its shape.

Above the depression, in the same hand that wrote at the Etching, a sentence carved into a sliver of the bone wall.`,

      description: `The Heart Chamber. Walls that pump red. A relic shard at the centre. A sentence carved above it.`,

      prophecy: {
        id: 'P18',
        title: 'Something Will Stand',
        text: `Something will stand at the centre
of the house and the fire and the lock
and the doors and the dust and the turning.
Not a key.
Not an ember.`
      },

      examineTargets: {
        'walls': 'Pumping. Slow. The cycle is longer than your breath.',
        'red': 'The light. The walls are full of what the light comes from.',
        'shard': 'Pale and pulsing. The third one. It belongs to something larger that is not whole.',
        'depression': 'The shard\'s exact shape. Whoever placed the shard knew where it would rest.',
        'sentence': 'In the hand that wrote at the Etching. The same. Always the same.',
        'lintel': 'Above the entry from the wound, scratched into the bone with a knife that is no longer here: a letter. **Y**. The mark is small. The mapper had to lean far down to make it.'
      },

      vrethkaiTargets: {
        'shard': 'You see it for what it is. The third shard is not stone. It is a piece of the first thing\'s heart, laid down to feed the lock. When all three pieces are taken back, the lock thins. When the lock thins, the cycle ends. The cycle was meant to end. The Immortal forgot to say so.',
        'walls': 'The walls are not pumping blood. They are pumping the slow breath of the thing that gave its body to the cycle. The breath has been slowing for long enough that this room is almost still.',
        'depression': 'It is not a depression. It is the place where a heart sat for the duration of the cycle. The heart you are about to take. The cycle remembers.'
      },

      actions: [
        {
          id: 'take_heart_shard',
          label: 'Lift it',
          text: `You lift it from the depression.

The room pumps once without you. Twice. The rhythm changes — slower. The walls are not full anymore.

You hold it in both hands. It is warm. It pulses against your palms with the same rhythm the room had when you arrived.

You do not have a place to put it down where it would be safe. You will carry it from here.`,
          once: true,
          giveRelic: 'shard_ruins3',
          setFlag: { heart_quieted: true },
          type: 'narration'
        },
        {
          id: 'offer_seal_blood',
          label: 'Set your forearm against the rim',
          requires: { hasIdentity: 'warden', hasRelic: 'shard_forest' },
          text: `You set the back of your forearm against the rim of the depression and let the wound the bone-floor opens take what it takes.

It does not take much. The depression drinks what is offered and stops drinking when the offering is enough. The room slows for a moment, and in that slowness it agrees.

The cathedral above will recognise what you have given here.`,
          once: true,
          setFlag: { seal_blood: true },
          type: 'narration'
        }
      ],

      exits: {
        up: { roomId: 'wound_eternal', label: 'Back up through the wound' },
        south: { roomId: 'quickening', label: 'South where the pulse quickens' }
      }
    },

    // ─── ROOM 50: THE QUICKENING (P17) ───
    {
      id: 'quickening',
      name: 'The Quickening',
      zone: 'ruins3',
      descriptionFirst: `The breath of the stone is faster here.

The pulse you have felt all through Ruins III has been slow until now. Here it is not. Here it is rapid. Here it is the rhythm of something coming, not something resting.

The walls vibrate at the edge of audibility. You cannot tell whether the sound is the stone, or you, or the air between you and the stone. The distinction stops being meaningful.

Above an archway at the southern end of the chamber, words have been carved in the same older hand. Different in their newness. The hand that wrote these has not been writing for as long as the hand that wrote the others.`,

      description: `The Quickening. The rhythm faster here. Walls vibrating at the edge of sound. New carving above the southern arch.`,

      prophecy: {
        id: 'P17',
        title: 'The Rhythm',
        text: `The turning quickens.
The dust rises.
The stones speak
in voices the living almost recognize.
The embers gather where the doors touch the dark.
The gathering has a rhythm.
The rhythm has a name.
The name is almost —
almost —`
      },

      examineTargets: {
        'rhythm': 'Faster. Coming, not resting.',
        'walls': 'Vibrating. The vibration is on the edge of sound. You feel it before you hear it.',
        'words': 'The hand is older than the others. Or younger. Or both. The hand has not been at this work as long.',
        'archway': 'South. Beyond it, the architecture changes again. The change is downward.'
      },

      exits: {
        north: { roomId: 'heart_chamber', label: 'Back to the Heart' },
        down: { roomId: 'antechamber', label: 'Down through the southern arch' }
      }
    },

    // ═══════════════════════════════════════════
    // ROOMS — THE SLEEPING CHAMBER (Rooms 51-54)
    // The bottom of everything. The witness who chose to sleep.
    // ═══════════════════════════════════════════

    // ─── ROOM 51: THE ANTECHAMBER (P19) ───
    {
      id: 'antechamber',
      name: 'The Antechamber',
      zone: 'sleeping',
      descriptionFirst: `The architecture stops trying.

There are no walls here. There is a space, and the space has decided to be a room only because something stands at the centre of it. A pillar. Or a person. Or both. The figure at the centre is stone and the stone has the suggestion of a face, and the face is sleeping.

This is not him. This is what was placed here to mark the way.

Around the marker, on the floor, in a circle wide enough that you have to walk it to read it all, a single passage has been cut. The hand is the oldest you have seen. Older than any cycle. Older than the cathedral. The hand wrote this before there were cycles to write inside.`,

      description: `The Antechamber. A pillar with a sleeping face. A passage cut in a circle on the floor.`,

      prophecy: {
        id: 'P19',
        title: 'The House Cracks',
        text: `Not called. Not made. Not written.
The house is old
and old things crack in unexpected places,
not because anything struck them
but because they were tired of holding.`
      },

      examineTargets: {
        'pillar': 'A marker. A figure of stone. The face suggests sleep without performing it.',
        'face': 'Asleep. The carver did not invent the sleep. The carver copied it.',
        'circle': 'Words cut into the floor in the oldest hand. You have to walk the circle to read it.',
        'space': 'No walls. The room is round because the marker is round.',
        'lintel': 'Above where the southern arch from the Quickening begins, in a hand younger than the marker but older than the mappers above: a letter. **A**.'
      },

      exits: {
        up: { roomId: 'quickening', label: 'Back up to the Quickening' },
        south: { roomId: 'final_choice', label: 'Onward, where the floor gives a choice' }
      }
    },

    // ─── ROOM 52: THE FINAL CHOICE (P20, Sleeping God gate) ───
    {
      id: 'final_choice',
      name: 'The Final Choice',
      zone: 'sleeping',
      descriptionFirst: `The floor splits.

Two paths beyond the antechamber. One descends. One does not. The descending path is bone-floored, dim, warm. The other path is grey stone — surface stone — and at its end you can see, for the first time in this cycle, the open sky.

The sky path was not here a moment ago. The sky path was always here. It is not a deception. It is a kindness. You have come far enough that the room is offering to let you go.

The descending path leads further. The descending path will not let you back.

A voice that is not a voice tells you the sky path closes if you choose. The descending path also closes if you choose. The room is a hinge. The hinge will only swing once.`,

      description: `The Final Choice. Two paths — sky home, or descent that does not return. The hinge swings once.`,

      prophecy: {
        id: 'P20',
        title: 'The Choice',
        text: `The hand will reach inside one final time,
or it will not.
The fire will speak its name,
or it will not.
The keys will turn,
or they will not.
Everything that comes next is a choice
made by those who were never meant to choose,
in a house that was never meant to hold them,
under a light that was never a star,
and then —`
      },

      examineTargets: {
        'sky path': 'Grey light. Surface stone. The way home, offered honestly. Choosing it ends here.',
        'descending path': 'Bone. Warm. Dim. Beyond it, something that has been waiting longer than language.',
        'hinge': 'The room. The room is the hinge. It will swing once.'
      },

      actions: [
        {
          id: 'take_sky_path',
          label: 'Step onto the grey stone',
          text: `You take the sky path.

The light brightens. The stone steadies. You climb without climbing — your feet move and the path moves under them, and the work of the climb is somewhere else, being done by something kinder. When you step out into the open, the wind finds you first.

Not every retreat is a failure. You came down. You came back. The dark let you go.`,
          setFlag: { escape_route: 'sleeping_gods_gift_offered' },
          moveTo: 'exit_surface'
        },
        {
          id: 'take_descending_path',
          label: 'Step onto the bone',
          requires: {
            minFragments: 20,
            hasFlag: 'reliquary_survived'
          },
          text: `You step onto the bone.

The sky path closes. Not loudly. The room agrees with your choice and does not argue.

The descent is short. The descent is long. Bone underfoot, then bone overhead, then bone on every side, and you cannot say when the change happened.`,
          moveTo: 'empty_room'
        },
        {
          id: 'take_descending_path_unprepared',
          label: 'Step onto the bone',
          requires: {
            not: { hasFlag: 'reliquary_survived' }
          },
          text: `You step onto the bone.

You are not carrying what was needed. You did not survive what would have prepared you.

The descent does not stop you. The descent does not need to.

You forget your name. You forget you had one.`,
          death: true
        }
      ]
    },

    // ─── ROOM 53: THE EMPTY ROOM (60-second silence gate) ───
    {
      id: 'empty_room',
      name: 'The Empty Room',
      zone: 'sleeping',
      descriptionFirst: `There is nothing here.

No walls — not in any sense you have a word for. No floor under your feet that is recognisable as floor. No light, but you can see. No air, but you can breathe.

There is no description for this room because there is nothing in it to describe. You are here. The room is here. Both facts are doing what they need to do without insisting on themselves.

The room is waiting.`,

      description: `The room is waiting.`,

      examineTargets: {
        'nothing': 'Yes.',
        'silence': 'It is the room. The room is it.',
        'self': 'Still here. Still you. For now.'
      },

      // Hints visible only to a player whose eyes have already been changed
      // — i.e. one who completed Vreth'kai-with-Mind in a prior run. The
      // empty room never explains its own gate to an untouched player.
      changedWorldTargets: {
        'silence': `You have heard this silence before. You heard it in the moment you were not yet what you became, between the shape closing and the word holding. The room is not asking for nothing. It is asking for what you held when you held nothing — and how long you held it.`,
        'nothing': `Nothing is what the room wants. Nothing is what you must hold. Not for a turn. Not for two. The room counts longer than your patience counts, but you have counted with rooms like this before. Hold it long enough and the south will agree.`,
        'self': `Still you. The version of you that survived the closing. The room knows. The room has been waiting for someone the room could recognise.`,
        'south': `The way south is not opened by anything you can do. It is opened by something you can stop doing. The room has been patient for cycles. You have time. The room has more.`,
        'room': `It is a chamber. It is also a question. The question is whether you can be still long enough for the chamber to recognise you. Untouched eyes do not see the question. You see it.`
      },

      hints: [
        'Some rooms wait for actions. Some rooms wait for their absence.'
      ],

      onEnter: function(engine) {
        engine.flags.empty_room_entered = true;
        // The silence is held by:
        //   - UI: 60 seconds of real-time without any input or click
        //   - Test/headless: engine.holdSilence() called explicitly
        // While silence_held is unset, the south exit is hidden.
      },

      exits: {
        south: {
          roomId: 'sleeping_god',
          label: 'South — into the chamber of the sleeping one',
          requires: { hasFlag: 'silence_held' },
          blockedText: `There is nowhere to go. Not yet. The wall is wall. The floor is floor. The room has not yet agreed to open.`
        }
      },

      inputMode: 'text'
    },

    // ─── ROOM 54: THE SLEEPING GOD (Ultimate ending) ───
    // Description is emitted by onEnter only for eligible players. An
    // ineligible player gets only the appropriate failure prose — no
    // contradictory "type a name" prompt while being kicked out.
    {
      id: 'sleeping_god',
      name: 'The Sleeping God',
      zone: 'sleeping',
      descriptionFirst: '',
      description: '',

      examineTargets: {
        'him': 'You cannot examine him. You can only stand inside him and choose.',
        'walls': 'He.',
        'sleep': 'Older than the prophecy. Older than the cycles. He chose it. He kept choosing it.'
      },

      onEnter: function(engine) {
        // Reset the captured name attempt and the two-phase confirmation
        // — fresh chamber, fresh attempt. If a player previously deferred
        // and came back via undo or a fresh run, they start with a clean
        // slate.
        engine._lastNameAttempt = null;
        engine._namingConfirmation = null;

        // Server-state check (only meaningful when Path B is wired): if
        // the Sleeping God has already been named globally, the chamber
        // is empty of him. Every subsequent player sees the actual name
        // chosen by the first reader, woven into the prose. No further
        // naming is possible — the canon has set.
        if (engine.serverState && engine.serverState.sleepingGodNamed) {
          const godName = engine.serverState.sleepingGodName || '—';
          engine._emit('output', `He is here.

He is awake.

The chamber is the shape of where he was. The walls remember the shape. The floor remembers the shape. The dim light remembers the shape. He is not in any of those memories now.

His name was spoken from somewhere in the world above, by a reader who had endured what you have endured and brought what you have brought. The name is **${godName}**. It is the only name he has ever had. The walls hold the syllables. The floor holds them. The dim light holds them. They do not echo. They settle into the stone like sediment, and stay.

There is nothing here for you to name. He is named. The cycle has tilted. What you came down for is up to you to remember.`, 'narration');
          engine.escape('basic_escape', '');
          return;
        }

        // Sleeping God naming is layered with three brutal gates, plus
        // two additional name-format gates enforced inside the engine
        // (alternating case + palindrome) when the player attempts to
        // speak. Only the first three are evaluated here:
        //
        //   1. hasItems — all 20 fragments, all 3 shards, quiet stone,
        //      empty-room visit. The chamber refuses the unprepared.
        //   2. hasWitnessed — Vreth'kai-with-Mind completed in any prior
        //      run. The chamber refuses one who has not been touched.
        //   3. hasEndured — full alt-case Vreth'kai escape (NOT cipher
        //      bypass). The chamber distinguishes the one who endured
        //      the breaking from the one who merely read its name.
        //
        // Each refusal kicks the player out as basic_escape with prose
        // appropriate to the specific failure — the gate stays opaque
        // (no explicit "you need X") but the in-voice cue is there for
        // a careful reader to parse on a subsequent attempt.
        const hasItems = engine.prophecyFragments.size >= 20
          && engine.relicShards.size >= 3
          && engine.hasItem('quiet_stone')
          && engine.flags.empty_room_entered;
        const hasWitnessed = !!engine.vrethkaiCompleted;
        const hasEndured = !!engine.fullVrethkaiEscape;

        if (!hasItems) {
          engine._emit('output', `You step into the chamber. It does not step back.

You are not ready. He continues to sleep. You forget his shape on your way back up, and the room forgets you with him.`, 'narration');
          engine.escape('basic_escape', '');
          return;
        }
        if (!hasWitnessed) {
          engine._emit('output', `He sleeps.

You have brought what the room asked you to bring. You have held what the room asked you to hold. You have come to where the room asked you to come.

But you have not seen what he saw. The cycle has not yet broken in you. The chamber will not break for you. The eyes you carry have not been changed by the thing that changes them.

You forget his shape on your way back up. He sleeps on. He has been patient. He will be patient again.`, 'narration');
          engine.escape('basic_escape', '');
          return;
        }
        if (!hasEndured) {
          engine._emit('output', `He sleeps.

You have brought what the room asked you to bring. You have held what the room asked you to hold. You have come to where the room asked you to come. You have seen what he saw.

But you did not endure the seeing. You spoke the word the carvers wrote and the dark let you pass without burning. The chamber knows the difference. The chamber asks for a name. Only one who survived the breaking can shape it. The breaking was not finished in you.

You forget his shape on your way back up. The word the carvers wrote was a kindness. The kindness is not what he is.`, 'narration');
          engine.escape('basic_escape', '');
          return;
        }

        // All three eligibility gates passed — show the chamber description
        // and the naming prompt. Naming itself is enforced by the engine's
        // _checkSleepingGodNaming: alternating case + palindrome.
        engine._emit('output', `He is here.

You did not see him at first. He is the size of the chamber. The chamber is the shape of him. The walls are him. The floor is him. The dim light is him.

He is asleep.

He has been asleep since the prophecy was first spoken. He heard it in a room that did not yet exist, in a body that no longer does. He chose to sleep until the cycle reached the point where it might shatter. The cycle has reached that point.

He has not yet woken.

You can wake him.

Give him a name. He has waited for one.

The name cannot be any name a cycle has used. Not for any of the twelve. Not for any of the things they were made to hold. Not for any title written into the cosmogony.

The name must be new. The cycle reads it the same forward as backward. The shape of it sits already in your jaw — bone-deep, lodged there since the breaking, waiting to be spoken.

(Type a name. The room is listening.)`, 'narration');
      },

      inputMode: 'text'
    },

    // ─── ROOM: CULTIST EMERGENCE (ending — exit via the Crucible after speaking the name) ───
    {
      id: 'cultist_emergence',
      name: 'After the Fire',
      zone: 'cultist',
      description: '',
      descriptionFirst: '',

      onEnter: function(engine) {
        const arrival = `The passage behind the basin is short.

You walk through stone that should be too hot to walk through. You walk through the residue of every burning. The stone parts where you step. It closes behind you. It has agreed.

When the passage ends, you are above ground.

The grass is dying. The sky is grey. The wind is the wind you grew up under. None of it has changed. All of it has changed. The world is fuel now. Every face you pass is a wick. The names you used to call the things in front of you have not survived the walking.

You will go down to a town in a valley by a river. You will find someone who is tired. You will speak.

The fire will follow you out. The fire has been waiting to.`;

        const epilogue = `\n\n— THE VOICE IN THE DARK —\n(You have earned the right to name a cult leader NPC in *Aurelon: The Crosslands*. A figure whispered about in taverns. Someone who came back from the deep with knowledge that shouldn't exist and followers who find their words impossible to resist.)`;

        engine._emit('output', arrival, 'narration');
        engine._emit('output', epilogue, 'narration');
        engine.escape('cultist', '');
      },

      inputMode: 'none'
    }
  ]
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_DATA;
} else {
  window.GAME_DATA = GAME_DATA;
}
