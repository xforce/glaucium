# Glaucium

**No configuration required** (on supported systems)

A server for collecting, processing, and displaying crash reports from
clients using the [Breakpad libraries](http://code.google.com/p/google-breakpad/)

## Supported Systems

* Debian Jessie (8)

## Installation

Coming Soon

## Upcoming Features

* Admin interface
  * Different auth backends (maybe just oauth with dex)
* User management
  * Non public mode (aka require users authentication to view reports)
* Ability to link source repositories to directly jump to source from crash reports
* API to allow submitting symbols (sym files or pdb files)
* RabbitMQ new crash storage to allow for distributed processors/collectors
* ? Don't do products and version implicitly but require them to be defined before hand (maybe optional)
* Microsoft Symbol Server proxy


## Code Quality...Sucks

The current quality of the code is rather bad (imo)  
I have nerver used go until i started this project and the primary goal was/is  
to get a working version out and then worry about cleaning up the code



## Special Thanks

- To Mozilla for creating [Socorro](https://github.com/mozilla/socorro),
  which served as a great inspiration and resource for this project,
  some parts are currently directly based on Socorro's implementation
  (mainly the processor and filesystem storage)
