var Sandbox = require('sandbox')
  , sandbox = new Sandbox()

var template_rex = /\$\{\s*(.*?)\s*\}/g
module.exports = ziggy_eval

function ziggy_eval(ziggy) {
  ziggy.on('message', parse_message)
  ziggy.on('pm', parse_pm)

  function parse_message(user, channel, message) {
    var bits = message.split(' ')
      , command = bits[0]
      , code

    if (template_rex.test(message) && command !== 'js') return templatize()
    if (command !== '!js') return

    code = bits.slice(1).join(' ')

    sandbox.run(code, do_output)

    function templatize() {
      var replacements = []
        , count = 0

      var code_chunk

      message = message.replace(template_rex, replace_code)

      for (var i = 0, l = replacements.length; i < l; ++i) {
        code_chunk = replacements[i]
        
        run_and_insert(code_chunk.code, code_chunk.offset)
      }

      function replace_code(chunk, code, offset) {
        ++count

        replacements.push({
            offset: offset
          , code: code
        })

        return ''
      }

      function run_and_insert(code, offset) {
        sandbox.run(code, do_insert)

        function do_insert(output) {
          message = [
              message.slice(0, offset)
            , output.result
            , message.slice(offset)
          ].join('')

          if(--count === 0) finally_talk()
        }
      }

      function finally_talk() {
        ziggy.say(channel, '"' + message + '"')
      }
    }

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

  function parse_pm(user, message) {
    return parse_message(user, user.nick, message)
  }
}
