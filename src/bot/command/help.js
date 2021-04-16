const Command = require("./command");
const { codeBlock } = require("../../util/format");

/**
 * Handle help command
 *
 * @param {String} prefix
 * @param {String} id
 * @param {Function} callback
 */
module.exports = {
  printHelp: function printHelp(prefix, id, callback) {
    // Looks weird but this lines up.
    const message = codeBlock(`Beep Boop.

  [COMMANDS]
  ${prefix}                         This help.
  ${prefix}${prefix}                        This help.
  ${prefix} SYMBOL... [OPTION...]   Price information for <SYMBOL>
  ${prefix}${prefix} QUERY [OPTION...]      Query results for <QUERY>
  
  [OPTIONS]
  watch[LOW|HIGH]           Watch the <SYMBOL> for if/when it crosses the <LOW> or <HIGH> points
  stopwatch                 Stop watching the <SYMBOL>
  options[WEEKS]            Get options chain data for WEEKS in the future. An empty WEEKS value gets current Weekly options.
  
  An OPTION can be added to a COMMAND by appending it with ':'
  
  [EXAMPLE]
  ${prefix}MSFT                     Gets price information for MSFT
  ${prefix}${prefix}Microsoft Corporation   Reverse lookup a symbol for 'Microsoft Corporation' and gets price information.
  ${prefix}AAPL:options             Gets price information and options chain data for this week for AAPL
  ${prefix}${prefix}Tesla:options           Reverse lookup a symbol for 'Tesla' and gets options chain data for this week.
  `);
    callback(
      {
        skipCache: false,
        messageId: id,
        messageText: message,
      },
      Command.EMPTY_OBJECT
    );
  },
};
