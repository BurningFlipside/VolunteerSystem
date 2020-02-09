# Flipside Volunteer System User Guide for Leads and AFs

When you log in at <http://secure.burningflipside.com/fvs>, you should see an **Admin** menu at the top that will let you set up options for volunteering in your department or area. Click on that and let's get started.

You'll start off in the dashboard. You'll notice a sidebar that takes you to the major administrative sections (described below), along with a nifty chart showing the overall state of volunteering. You can get more detailed stats on volunteering under **Reports**. We'll talk about that later.

## How this all works

### Events, Departments, Roles, and Shifts

The FVS is organized by Events and Shifts, Departments and Roles--these are central organizing concepts. You'll see each of these in the sidebar menu on the admin page. An AF can create an event and add departments to it, and can create/edit departments. A lead or AF can create roles and shifts withing their department if it is active at that event.

## Events

What's an event? "Burning Flipside 2020" is an obvious example, but we have set up events for just about everything that requires volunteers—work weekends, load in, etc. We can create and delete events as needed, and set some key parameters for them—whether the event requires a ticket, what departments work that event, whether the event is publicly visible, and we can even create a restricted pool of volunteers for that event.

## Department

Hopefully you get this. Rangers, Greeters, etc.

This page lets us create, delete, and edit departments. This includes seting key parameters for them, much like events. One key parameter that may be of interest to leads is setting "other admins," so that someone other than the lead can administer the department. You'll set other admins using the e-mail address that the person uses to log in to profiles.burningflipside.com

## Roles

Roles are different kinds of volunteers within a department. For example, Greeters may have line-volunteer greeters (line volunteer is the generic term we use for someone who's not in any kind of leadership role) and shift leads. Rangers have more roles: dirt rangers, assistant khaki, khaki, and R12.

This page lets us create, delete, and edit roles. Some of the parameters we can set here are whether the role is publicly visible, whether it can be grouped, and whether it can be grouped with another role. It lets us set a minimum rest period between shifts,

### Restricting access to roles

We can specify that the role is available only to a limited list of volunteers. There are only a few people who are qualified to be R12, for example, so by entering their e-mails here, you can ensure that they and only they will be able to sign up for R12 shifts.

We can also set credentialing requirements for certain roles. Currently we have set up Basic Life Support, ICS 100, and ICS 200 as available credentials that might be required for a role, but we can add others. We can set a role to require any of these.

If a role requires a credential, the volunteer will be prompted to upload their certificate when they put their name down for a shift. It will be up to the department lead or admin to review those credentials under **Certification Approval**

### Group shifts

Group shifts enable a common form of volunteering, where an entire theme camp takes over all the shifts in a department for a certain time slot. The way this works from the volunteer's perspective is that when the first person in a camp signs up for a group shift, they can generate a group-signup link and share that with their campmates, who can follow that link directly and sign up together. 

Ice is a complex example of this. Ice has four roles: shift leads, cashiers, slingers, and pushers. Typically Ice needs 6 line volunteers—two each of cashier, slinger, and pusher—plus a shift lead. All of these roles can be grouped together for the purpose of setting up a group shift, so that we don't wind up in a situation where one person sets up a group that is just two people volunteering as cashiers, then another person does the same for slingers, etc. This is set up under the **Can be grouped with** column. The reason this is handled at the role level and not the department level is because there might be some roles that *shouldn't* be available for group signups.

## Shifts

A shift is a single period of time filled by a single role.

As you may have noticed, each of these layers involves more complexity and detail than the last, and shifts are probably the most complex part of this system, but don't let it overwhelm you.

There are three subsections to the Shifts section: add/edit shifts, pending shifts, and early entry/late stay approval.

### Add/Edit Shifts

On this page, you'll see a list of all the departments. If you click on one, that will disclose all the shifts already set up in that department, plus buttons to add a new shift or a new shift group.

Some shifts will be filled by more than one person: for example, there will ideally be 10 dirt ranger on a shift. These will be preceded by the "group" icon <i class="far fa-object-group"></i>

When you click on **Add new shift**, you'll be presented with the various options for that shift:

- Roles: The role that this shift applies to, and, if there are multiple people in this role on this shift, the number of people
- Start time and end time: Self-explanatory.
- Enabled: Self-explanatory.
- Unbounded: Needs some explanation. In some situations, there's no upper limit on the number of volunteers that we'll let sign up. Work weekends, load in, and load out would be examples of this. Checking **Unbounded** ensures that there will always be an open slot for someone to sign up.
- Minimum open shifts: This relate to **Unbounded**—if a shift is unbounded, this is the number of open shifts that will always be visible.
- Shift name: This is optional, but if you don't fill it in, the system will generate a long name that represents all the key details, so it's a good idea to give each shift a short, clear name, like "Friday afternoon Greeters."
- Early entry/stay late window: Volunteers who are going to be working Thursday-morning shifts are entitled to arrive Wednesday afternoon. Likewise, volunteers working Monday afternoon are entitled to spend Monday night on the property. This lets you set whether volunteers on this shift are entitled to early entry or late stay, and which specific period they're entitled to.
- Create copies: You can create multiple identical copies of the same shift. This is a convenient way to spin up a bunch of identical shifts that you'll later edit (to change their dates, for example), but if you actually want multiple instances of exactly the same shift, you probably want to create a **shift group** instead (see below). **Note** If you want to create copies, enter the number of copies and then click **Create copies**: if you press **Create shift**, you'll just create one copy of the shift.

#### Shift Groups

Shift groups and group shifts are not the same thing! Group shifts permit members of a group to sign up for a shift together. A shift group gives someone designing a shift schedule—someone like you—a shorthand for managing shifts in the same department with the same start and end times, but doesn't make those shifts available as group shifts.

When you click on **Add new shift group**, you'll be presented with the various options for that shift group:

- First, under **Basic Info**, you'll set up the department, times, etc.
- Second, under **Roles**, you'll add roles to the group. You can add multiple roles. So, for example, if you're designing a shift for Ice, you can add slingers, pushers, and cashiers. You'll also add the number of volunteers you need in each role for that shift.

#### Editing Shifts

You can edit an existing shift or shift group by clicking on it. This will bring up an information panel similar to the shift-creation panel, but with a few different actions.

- If you are editing a shift or shift group, you can group it with other shifts or shift groups to create a shift group (only if there are other shifts in the same department with the same times), or expand an existing shift group.
- You can delete the shift or shift group.

Note that when you are editing an individual shift, you can change the role assigned to it, but when you are editing a shift group, the roles can't be changed.

### Pending shifts

Volunteers signing up for shifts that require a lead's approval are listed here. If someone volunteers for overlapping shifts, for example, this is where you'll approve them.

### Early Entry/Late Stay approval

We take the early-entry list seriously. There are some people we trust to be at Flipside when the volunteer departments are fully up to speed, but might not want there when we're running on a skeleton crew. Leads, AFs, and AAR members are automatically approved for early entry. Everyone else, including people who have signed up for shifts that would make them eligible for early entry, needs to be approved. And we do not treat these people as interchangeable parts. We approve the person, not a nameless warm body filling a slot.

This page gives you an overview of the people waiting to be approved for early-entry status. You can see their name, which flavor of early entry they are eligible for, and their ticket status. Their shifts can by viewed by clicking on the icon under the **Shifts** column. You can approve of deny their status with the thumbs-up/thumbs-down buttons.

## Volunteers

This gives a big overview of everyone signed up as a volunteer.

## Certification Approval

Some roles require certification, and when a volunteer signs up for one of those roles, they will be prompted to upload a digital copy of their cert. This lets you review their certs and confirm that the volunteers are eligible for those roles.

## Reports

There's a bunch of useful stuff in here.

Shift schedule
:	Lets you export a department's shifts as PDFs or an Excel spreadsheet. The "simple schedule" gives you a straightforward list of every shift and everyone on that shift for your department--this would be useful to print out ahead of time. The "schedule grid" might be a little overwhelming to print out, but might be a more useful for some people.

Shift statistics
:	Gives a mile-high view of volunteering for the event.

T-shifts
:	Gives an overview of T-shirt needs per department.

Participant shifts
:	Shows volunteers by name, and how many shifts they are taking, to help us identify rockstars.

Volunteers without Shifts
:	Similar to the above, shows people in the volunteer system without any shifts.

Empty shifts
:	What it says on the tin

Early Entry/Stay Late
:	Gives a list of volunteers approved for early entry/stay late, so they can be contacted with the "Welcome to Early Entry" message.

## Contact

Lets you contact all the volunteers in a department, or on a shift, all at once.

