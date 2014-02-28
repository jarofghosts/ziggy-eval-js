var Sandbox = require('sandbox')
  , sandbox = new Sandbox()

module.exports = ziggy_eval

function ziggy_eval(ziggy) {
  ziggy.on('message', parse_message)

  function parse_message(user, channel, message) {
    var bits = message.split(' ')
      , command = bits[0]
      , code

    if (command !== '!js') return

    code = bits.slice(1).join(' ')

    sandbox.run(code, do_output)

    function do_output(output) {
      if ((!output.result || output.result === 'null') &&
          output.console.length) {
        for (var i = 0, l = output.console.length; i < l && i < 5; ++i) {
          ziggy.say(channel, output.console[i])
        }

        return
      }

      if (output.result) return ziggy.say(channel, output.result)


      ziggy.say(channel, user.nick + ': invalid request!')
    }
  }
}
