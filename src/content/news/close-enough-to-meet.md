---
title: "Close enough to meet, never precise enough to find"
description: "How we’re designing location in Swoovr: what we use, what we refuse to use, and why \"nearby\" should never become a way to find someone."
date: 2026-11-08
draft: false
category: "Privacy & design"
author: Swoovr team
---

Location is one of the most useful things a connection app can know about you, and one of the most dangerous. It helps people find someone they could actually meet for a coffee. Handled carelessly, it can also tell a stranger which street you live on.

Over the past few weeks a large part of our engineering work has gone into one question: how much location does Swoovr need to be useful, and how do we make sure it never shares more than that? This post explains what we’ve decided, what we’ve built and tested so far, and what still has to happen before any of it reaches members.

It’s a long post. Location deserves the detail.

## Why "show the distance" isn’t a small decision

You might think the risk is an app printing someone’s exact distance, such as "1.3 km away". That is a risk. If you can see a precise distance from three different spots, you can work out where someone is. The technique is called trilateration, and it has been a known problem for location-based apps for more than a decade.

The more recent finding is that hiding the number isn’t enough. In 2024, researchers at KU Leuven published [a systematic analysis of 15 location-based dating apps](https://www.usenix.org/conference/usenixsecurity24/presentation/dhondt) at the USENIX Security Symposium. They found that six apps could be used to pinpoint a person’s location, in some cases [to within about two metres](https://techcrunch.com/2024/07/31/bumble-and-hinge-allowed-stalkers-to-pinpoint-users-locations-down-to-2-meters-researchers-say). The most common weakness wasn’t a displayed distance. It was what the researchers called *oracle trilateration*. An attacker adjusts a distance filter, watches whether a person appears or disappears from their results, and narrows down where that person is.

The researchers recommended user control, data minimisation and API hardening. The paper is [open access](https://www.usenix.org/conference/usenixsecurity24/presentation/dhondt) and worth reading if you build anything with a location feature. Most of the apps involved have since fixed the issues. The lesson for us was that location privacy depends on every part of the system that touches a position: settings, filters, results lists, ordering, and how often someone can ask.

That shaped every decision below.

## Two sources of location, and only two

Swoovr can work out where you are in two ways:

1. **Your Home City**, which you choose from a list of real places when you set up your profile.
2. **Your device’s location**, but only when you allow it and only for features that need it.

We don’t estimate your location from your internet connection. You can’t type in a "current location" or move a virtual pin. You can’t manufacture presence somewhere you aren’t. If your device location isn’t available, Swoovr falls back to your Home City, and we never present that fallback as proof that you’re physically there.

This narrow approach is deliberate. Australia’s privacy law says an organisation should only collect personal information that is [reasonably necessary for its functions or activities](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-3-app-3-collection-of-solicited-personal-information). The Office of the Australian Information Commissioner’s 2026 guidance on that principle puts more weight on proportionality and data minimisation. Each extra location source would mean more data, more ways for things to go wrong and more for people to understand. Two sources cover what the product needs.

## We removed the suburb field entirely

Earlier designs had an optional free-text "Area" on profiles, where someone could write a suburb or neighbourhood. We’ve removed it completely: from profiles, from screens and from the database.

The reason is simple. A suburb on a public profile, combined with a photo and a few details, can narrow down where someone lives far more than most people realise. eSafety’s [online dating guidance](https://www.esafety.gov.au/key-topics/staying-safe/online-dating) advises people to be careful with details like their address and workplace. We would rather not offer a field that encourages people to share that kind of thing at all.

Your Home City still matters. It decides which local community you belong to, and changes to it are limited to once every 30 days, so it can’t easily be used to hop between places. But it’s a city, not a street.

## Two ways to explore: your community, or near you right now

Explore, the grid where you browse people, will offer a choice:

- **Home market** shows people in your local community, based on Home City. This is the default and needs no device location.
- **Near me** shows people around you right now. It needs a recent reading from your device.

Near me is controlled by two settings. **Both are off by default**, and neither is switched on just because you’ve given the app location permission on your phone:

- **Appear in nearby searches** decides whether *other people* can find you in Near me.
- **Show my approximate distance** decides whether distance information is shared about you, and whether you see it about others.

These settings are separate on purpose. You can browse Near me with your own location without ever appearing in anyone else’s results. And distance works both ways: you only see approximate distances for other people while your own "Show my approximate distance" setting is on. If you want that information about others, you share the same about yourself.

People who live in the area by Home City can still appear in Near me as ordinary locals, the same way they would to someone visiting. A local’s device location is never used unless they’ve chosen to appear in nearby searches.

## Distances are bands, never numbers

When a distance is shown, it’s a band such as "Nearby", "Within 10 km", "10–20 km" and so on up to "Over 50 km". Swoovr never shows a number of kilometres or metres. Results in Near me are ordered by band, not by exact distance, so the ordering of a list can’t be used to work out a precise distance either.

"Nearby" (roughly within 2 km) is the most sensitive band, so it has the strictest rules. It’s only shown when both people’s readings are recent (within 15 minutes) and accurate to within 250 metres. If those conditions aren’t met, the band is shown as unknown rather than guessed.

Every band also carries its **basis**. A band worked out from device location is labelled differently from one worked out from two Home Cities, which we describe as how far apart those home cities are. We never present one as the other. Saying two people’s home cities are 20–30 km apart is a very different claim from saying a person is 20–30 km from you right now.

## Closing the filter loophole

This is the part most directly shaped by the KU Leuven research.

Everyone will be able to set a maximum distance in their filters. But the filter only takes fixed values (5, 10, 25 or 50 km, for example), not any number you type. A value in between is rounded up to the next allowed step. You can’t move the filter a few hundred metres at a time to watch someone appear and disappear.

There are a few more safeguards around it:

- **Searches and filter changes are rate-limited.** Each person gets a limited number of searches and filter changes per hour. Probing someone’s location takes many repeated queries, and the limits are set so that can’t be done quickly. We keep only a record that a search happened, never what was searched for, and that record is cleared after a day.
- **Home locals aren’t filtered by your device position.** In Near me, people shown because of their Home City are kept or dropped by your other filters, not by distance from wherever you’re standing. Otherwise someone could walk around a suburb with a tight filter and narrow down where a person lives.
- **Blocks work in both directions.** If either person has blocked the other, neither sees the other, and neither gets a distance band.

We test this the way an attacker would. One of our automated test suites moves the distance filter a kilometre at a time and checks what can be learned. The only answers it can get are the coarse steps, such as "within 5" or "within 10". If a change ever lets that suite learn more, the test fails.

## What we keep, and for how long

Device location is the most sensitive data in this feature, so it has the strictest handling we’ve designed so far:

- **Only fresh, sensible readings are accepted.** A reading must be no more than two minutes old and accurate to within 2 km, and it must pass a basic plausibility check (for example, nobody moves faster than an aircraft between readings). A device can send at most one reading every five minutes.
- **It’s rounded before it’s stored.** We store your latest position rounded to roughly 500 metres, encrypted, as a single entry. There is no location history. A new reading replaces the old one.
- **It expires quickly.** A reading stops being used exactly two hours after it was taken. A cleanup process normally deletes it within five minutes after that.
- **It’s deleted when you change your mind.** Turning off "Appear in nearby searches", signing out of every device, or deleting your account removes your stored position straight away.
- **It never leaves our servers as a position.** All distance calculations happen on Swoovr’s servers. The apps and website receive only a band, such as "Within 10 km", never coordinates and never a distance figure.

## Travelling to another city

Travel works differently, because it involves people who aren’t there yet.

You can add a trip to an available city. Up to 14 days before you arrive, you can choose two things separately: whether people there can discover you before you arrive, and whether you can browse people there before you arrive. Before arrival you can look, but you can’t send requests or messages. People in that city can choose whether to reach out to incoming visitors.

When you arrive, you check in with a single device reading that shows you’re actually there. For the rest of the trip, that city becomes your active location for Explore. It doesn’t change your Home City. When the trip ends, Explore goes back to your home community on its own. Connections you made while travelling are kept.

We think this balance matters. Seeing who’s in a city before you visit is useful. A stream of messages from people who aren’t there, and may never arrive, is not.

## A monthly check that suggests, never decides

People move, and a Home City set a year ago may no longer be right. Keeping it accurate helps local communities stay meaningful, but we didn’t want to watch people’s movements to do that.

So the design is cautious. About once a month, *only for people who shared device location during that period*, Swoovr looks at whether most located days were away from their Home City. Each day is reduced to a simple outcome (home, away, or excluded) with **no coordinates attached**, and those outcomes are kept for no more than 35 days. Days on a checked-in trip don’t count. If there aren’t enough days with readings, spread across the month, the check doesn’t run.

If the pattern clearly suggests someone may have moved, a member of our support team may send a friendly note suggesting they update their Home City. That’s all it does. The check never changes your Home City, never restricts your account and never puts a warning on it. Support sees only counts (for example, "away on 15 of 17 days with readings"), never places, positions or trip destinations.

## Why we’re telling you before it’s live

Everything described here has been built and tested in our own development environment. **None of it is available to members yet.**

There are a few reasons for that.

First, we want the explanation in place before the feature. A revised Privacy Notice covering Near me, distance bands, Travel check-in, the monthly Home City check and retention periods has been written and approved, but it hasn’t been published yet. These features won’t be switched on until it is, and members will be told about the change when it is published. The notice also treats device location as potentially *precise geolocation*, the stricter category some privacy laws use, even though what we store is rounded.

Second, the website and web experience come first, and the phone apps follow. The permission wording on iOS, Android and the web has to match what the feature actually does.

Third, we want real feedback. The [Adelaide beta](/news/why-adelaide-first/) is where we’ll learn whether "Appear in nearby searches" and "Show my approximate distance" mean what people expect, whether bands give enough information, and whether anything feels uncomfortable.

## Part of a bigger safety picture

Location design is one part of safety, not all of it. Australia’s dating industry has a voluntary [Online Dating Industry Code](https://www.infrastructure.gov.au/department/media/news/new-online-dating-industry-code-improve-safety), overseen by the eSafety Commissioner, which sets out expectations for reporting tools, support and how harmful accounts are handled. We take those expectations seriously as we build the rest of Swoovr. That includes [verification with a clear meaning](/news/verification-with-clear-meaning/), [boundaries that are respected in discovery](/news/intentions-and-boundaries/), and reporting and blocking that work.

No setting replaces your own judgement. eSafety’s advice on [staying safe while dating online](https://www.esafety.gov.au/key-topics/staying-safe/online-dating) is a good read for anyone, whatever app they use: meet in public, tell someone you trust where you’re going, and keep personal details to yourself until you’re comfortable.

What we can do is make sure Swoovr never becomes the tool that gives away where you are. Being close enough to meet is the point. Being precise enough to be found is not.

[Read our privacy approach](/privacy/), [see how safety is designed in](/safety/), or [tell us what you think](/contact/?topic=feedback). If location privacy matters to you, we’d especially like to hear from you during the beta.
