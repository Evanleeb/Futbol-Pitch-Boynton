# Futbol Pitch Boynton

Interactive space plan for **Suite 650, Building A, BC Commerce Center**,
8255 Boynton Beach Blvd, Boynton Beach, Florida.

Prepared by Butters Construction and Development.
Schematic for discussion only. Not for construction. Tenant name is a placeholder.

## What is in here

    index.html    cover page, chalk plan that marks itself out
    plan.html     the interactive tool
    model.js      the 3D scene and all shared geometry
    robots.txt    keeps the page out of search results
    .nojekyll     tells GitHub Pages to serve the files as is

Self contained. The only external dependencies are three.js from cdnjs and
Google Fonts. No build step.

## Deploy to GitHub Pages

1. Create a repo, for example `evanleeb/Futbol-Pitch-Boynton`
2. Upload every file in this folder to the root of the `main` branch
3. Settings, Pages, Source: Deploy from a branch, Branch: main, Folder: / (root)
4. It publishes at `https://evanleeb.github.io/Futbol-Pitch-Boynton/`

Share the root URL, not `plan.html`, so the cover page loads first.

## The shell

Suite 650 is the end bay of Building A. The structural grid falls on the
demising lines, so the bay is a clear span with no interior columns.

    interior width    69'-6"
    interior depth   191'-6"
    interior area     13,309 SF
    clear height      32'-0"
    loading           one grade level overhead door at the rear

These are set once at the top of `model.js`:

    var SHELL = { w:69.5, d:191.5, clear:32 };

## What the tenant can change

Program comes in two kinds.

**Locked.** One strip along the north wall, fifteen feet deep with a flat
south edge, tiling the full 69'-6" of the bay:

    Entry and Viewing    35'-6" x 15'-0"     532 SF
    Office               10'-0" x 10'-0"     100 SF
    Storage              10'-0" x 10'-0"     100 SF
    Changing Room A       7'-0" x 10'-0"      70 SF
    Changing Room B       7'-0" x 10'-0"      70 SF
    Back of House hall   34'-0" x  5'-0"     170 SF
                                           1,043 SF

Each changing room carries a 3'-0" transfer shower with a curb and glass
panel, one water closet and one lavatory.

The corridor runs behind the office, storage and both changing rooms. Every
one of them opens onto it, so nothing is reached by walking through anything
else. It meets the lobby at its west end and has a second door to the open
floor beside the changing rooms, so players coming off the turf reach a
shower without crossing the lobby.

Nothing in the strip steps down into the open floor, which is the point:
however the party rooms get dragged around, no leftover corner is created
behind them. The test harness samples the whole 69'-6" x 15'-0" rectangle on
a half foot grid and asserts every point falls in exactly one room, and
separately that the entire south face sits at z 15.

The strip does not move. The entry anchors the storefront and the changing
rooms sit on the sanitary stub, and showers need floor drains sloped to that
line, so relocating any of it means saw cutting the slab and rerouting
underground. That is real money and real schedule, so the tool does not offer
it.

**Free.** Both party rooms are dry, so they go anywhere in the suite. They
carry their own four walls and the door places itself on whichever face
points back toward the entry, so the partitions follow the room instead of
being drawn by hand.

Pitches and party rooms both have four numbers, all in feet:

    x   distance east from the west wall
    z   distance south from the front wall
    w   pitch width
    d   pitch length

They can be changed three ways, and all three drive the same state:

- drag the box on the chalk plan to move it
- drag the square grip at its southeast corner to resize it
- use the sliders in its card for exact numbers

Everything downstream updates live: the 3D turf, the pitch markings, goal
size, containment netting and posts, room walls, the door face, the tables
and chairs, seat counts, the area meters and the fit check. Values snap to
the nearest six inches.

## Fit check rules

Errors, shown in red:

- anything runs past the demising line or the shell
- the two pitches overlap each other
- the two party rooms overlap each other
- a party room sits on a pitch
- a party room overlaps a locked room
- there is no route from the entry to a party room without crossing turf

Warnings, shown in amber:

- less than 3'-0" between a pitch and a side wall
- less than 5'-0" behind the south pitch, which the overhead door needs
- less than 6'-0" between the two pitches
- a pitch under 30' wide or 40' long
- a pitch that is walled in and cannot be reached from the entry
- a party room under 300 SF, which seats about six
- a party room more than 60' back from the welcome desk, which is harder to
  supervise and harder to staff

The base layout clears all of them.

## Clearances

Select a pitch or a room and four dimension strings appear on the plan, one
per face, plus a readout in its card. They measure to the nearest thing in
that direction, not always to the wall, so the south face of Pitch 1 reads to
Pitch 2 rather than to the rear wall 80 feet beyond it, and the west face of
Party Room A reads to the entry. The target is named under each figure.

They redraw on every change, so a resize shows you what you are eating into
as you drag. Colour follows the same thresholds as the fit check: normal
above 3 feet, amber under 3 feet, red at zero or overlapping.

Dimensions follow the selection rather than showing on everything at once.
On a plan this narrow, four strings per box across four boxes is unreadable.

### How the access check works

Errors about overlaps are just rectangle maths. The route check is a one foot
grid over the whole suite. Every cell inside a pitch or a room is marked
blocked, the fill starts from the free cells ringing the entry, and it spreads
four ways. Anything the fill cannot touch is not served.

The grid is a whole number of feet and the bay is 69'-6" by 191'-6", so the
last row and column of cells fall outside the shell. They are blocked
explicitly. Without that they act as a one foot corridor running the full
length of both walls and every layout passes. That is what catches
the case where a tenant drags a pitch wall to wall and strands a party room
behind it, which no amount of overlap checking would find.

Overlap errors suppress the route check, since a layout with boxes sitting on
top of each other has no meaningful geometry to trace.

## Base layout

    Pitch 1        57'-0" x 64'-0"   at x 6,  z 48
    Pitch 2        57'-0" x 64'-0"   at x 6,  z 119
    Party Room A   22'-0" x 21'-0"   at x 8,  z 21     24 seats
    Party Room B   22'-0" x 21'-0"   at x 36, z 21     24 seats

    turf                          7,296 SF
    party rooms                     924 SF
    locked strip                  1,043 SF
    circulation and run out       4,047 SF

Six feet clear between the locked strip and the party rooms, six between the
party rooms and Pitch 1, seven between the pitches, and 8'-6" behind Pitch 2
for the overhead door. Six feet between the two party rooms gives a cross
aisle rather than a dead slot.

## Editing the locked program

The locked rooms are the `LOCKED` array in `model.js`. One row per room:

    { id:'wcA', name:'Changing Room A', short:'WC/SH', x:55.5, z:0,
      w:7, d:10, kind:'tile', col:'#8FA9C4' }

`short` is the tag drawn on the chalk plan, since the full name will not fit
in a seven foot box.

The strip is expected to tile the north wall with no gaps. The test harness
asserts every row sits at `z:0`, is 10 feet deep, and that the widths sum to
`SHELL.w` exactly. If you resize one room, take the difference out of the
entry.

`kind` sets the floor finish: `wood`, `tile`, `carpet` or `seal`. The 3D
floor, the chalk plan, the schedule and the label all read from the same row.

The partitions inside the locked cluster are the `LOCKED_WALLS` array, since
those rooms never move and their shared walls can be stated once. Each row is
`[x1, z1, x2, z2, doorFraction, doorWidth]`; pass `null` for the fraction to
get a solid wall. If you move a locked room, move its walls to match.

Party rooms need no entry here. They are the `DEFAULT_ROOMS` array and build
their own walls in `buildRooms()`.

To unlock a room, move its row from `LOCKED` to `DEFAULT_ROOMS`, delete the
`LOCKED_WALLS` rows that bounded it, and add a card for it in `plan.html`.
The tool assumes exactly two free rooms in a few places, so check
`enc`, `dec` and the fit check before going past two.

## Seating

Seats are derived, not typed in. `tableGrid()` fits 5' round tables on 8'-6"
centres with an 18" edge margin and seats six per table. A 23'-6" x 21'-0"
room takes four tables and seats 24. Shrink a room and the tables, the chairs
and the seat count all come down together.

## Presets

The chips under the pitch cards are the `PRESETS` array in `plan.html`:

    { k:'7v7', w:57, d:75 }

Add or edit rows freely. A preset applies to whichever pitch is selected and
centres it in the bay.

## Sharing a layout

"Copy this layout" writes the four numbers per pitch into the URL as `?p=`
and copies it. Opening that URL restores the exact layout. The last layout is
also kept in `localStorage`, so the tenant's own session survives a refresh.
"Reset to base plan" clears both.

## Kick to enter

The call to action on the cover page is a ball in front of a goal. Clicking
it boots the ball into the net with a curl and a spin, the net gives, the
label flips to "Goal," and the page moves to `plan.html` about a second
later.

It is a real `<a href="plan.html">`, not a scripted button. That matters more
than it sounds:

- with JavaScript off, or if the animation ever breaks, it is still a link
- command click and control click open the plan in a new tab, because the
  handler checks for modifier keys and gets out of the way
- keyboard users tab to it and press Enter
- `prefers-reduced-motion: reduce` skips the whole thing and navigates
  straight through

The net weave is generated in script and clipped to the goal mouth, so
resizing the goal does not leave the mesh hanging outside the posts.

Two mobile details worth leaving alone. The hover states are gated behind
`@media (hover:hover) and (pointer:fine)` so iOS does not spend the first tap
activating a hover state, and `touch-action:manipulation` removes the 300ms
double tap delay. Both were learned the hard way on an earlier build.

## Walkthrough

"Walk through" drops the camera to 5'-8" inside the current configuration and
hides the shell walls so you can see out.

    desktop   W A S D or arrows to move, drag to look, Shift to jog, Esc to exit
    phone     drag to look, on screen stick to move

## Notes

- `wallRun()` builds its segments along local z and then rotates the group by
  the run angle. That rotation is the run angle exactly. An earlier version
  subtracted 90 degrees, which threw every wall in the model perpendicular to
  its own run, so party room walls shot out across the pitches. There is a
  regression test for it.
- The turf markings are generated on a canvas at 8 pixels per foot, so line
  weight stays true at any pitch size and penalty areas scale without
  colliding.
- Goal size scales with pitch width and is clamped between 8' and 24'.
- "Match light" swaps daylight for point lights under the deck.
- "Full height" raises the walls from the 11' cutaway to the real 32'.
