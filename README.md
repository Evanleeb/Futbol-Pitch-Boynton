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

Everything from the front wall back to `FRONT_BAND` (34 feet) is fixed
program: entry and viewing, two party rooms, restrooms, office and equipment
storage. Everything south of that line is theirs to lay out.

Each pitch has four numbers, all in feet:

    x   distance east from the west wall
    z   distance south from the front wall
    w   pitch width
    d   pitch length

They can be changed three ways, and all three drive the same state:

- drag a pitch on the chalk plan to move it
- drag the square grip at its southeast corner to resize it
- use the sliders in the pitch card for exact numbers

Everything downstream updates live: the 3D turf, the pitch markings, goal
size, the containment netting and posts, the area meters and the fit check.
Values snap to the nearest six inches.

## Fit check rules

Errors, shown in red:

- a pitch runs past the demising line or the shell
- a pitch crosses into the fixed front band
- the two pitches overlap each other

Warnings, shown in amber:

- less than 3'-0" between a pitch and a side wall
- less than 5'-0" behind the south pitch, which the overhead door needs
- less than 6'-0" between the two pitches
- a pitch under 30' wide or 40' long

The base layout clears all of them.

## Base layout

    Pitch 1     57'-0" x 68'-0"   at x 6, z 40
    Pitch 2     57'-0" x 68'-0"   at x 6, z 115
    turf                          7,752 SF
    fixed program                 2,363 SF
    circulation and run out       3,194 SF

## Editing the fixed program

The front band is the `ROOMS` array in `model.js`. One row per room:

    { id:'partyA', name:'Party Room A', x:22, z:0, w:23.5, d:21,
      kind:'wood', col:'#FFB03A' }

`kind` sets the floor finish: `wood`, `tile`, `carpet` or `seal`.
The 3D floor, the chalk plan, the area schedule and the label all read from
the same row, so one edit updates everything.

If a room moves or resizes, check that the rows still tile the band cleanly.
The test harness asserts they do not overlap and that they fill
`SHELL.w x FRONT_BAND` exactly. Interior partitions are the `P` array in
`buildRooms()` and are drawn separately, so move those to match.

To change the depth of the fixed band, edit `FRONT_BAND`. The fit check and
the slider limits both read it.

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

## Walkthrough

"Walk through" drops the camera to 5'-8" inside the current configuration and
hides the shell walls so you can see out.

    desktop   W A S D or arrows to move, drag to look, Shift to jog, Esc to exit
    phone     drag to look, on screen stick to move

## Notes

- The turf markings are generated on a canvas at 8 pixels per foot, so line
  weight stays true at any pitch size and penalty areas scale without
  colliding.
- Goal size scales with pitch width and is clamped between 8' and 24'.
- "Match light" swaps daylight for point lights under the deck.
- "Full height" raises the walls from the 11' cutaway to the real 32'.
