var Sandbox = require('sandbox')

var sandbox = new Sandbox()

var templateRex = /\$\{\s*(.*?)\s*\}/g

ziggyEval.help = [
    '!js <code> - evaluate <code> and return result'
  , 'use ${ <code> } anywhere in a message to evaluate <code>'
].join('\n')

module.exports = ziggyEval

function ziggyEval(ziggy) {
  ziggy.on('message', parseMessage)
  ziggy.on('pm', parsePm)

  function parseMessage(user, channel, message) {
    var bits = message.split(' ')
      , command = bits[0]
      , code

    if(templateRex.test(message) && command !== 'js') return templatize()
    if(command !== '!js') return

    code = bits.slice(1).join(' ')

    sandbox.run(code, doOutput)

    function templatize() {
      var replacements = []
        , count = 0

      var codeChunk

      message = message.replace(templateRex, replaceCode)

      for(var i = 0, l = replacements.length; i < l; ++i) {
        codeChunk = replacements[i]

        runAndInsert(codeChunk.code, codeChunk.offset)
      }

      function replaceCode(chunk, code, offset) {
        ++count

        replacements.push({
            offset: offset
          , code: code
        })

        return ''
      }

      function runAndInsert(code, offset) {
        sandbox.run(code, doInsert)

        function doInsert(output) {
          message = [
              message.slice(0, offset)
            , output.result
            , message.slice(offset)
          ].join('')

          if(--count === 0) finallyTalk()
        }
      }

      function finallyTalk() {
        ziggy.say(channel, '"' + message + '"')
      }
    }

    function doOutput(output) {
      if((!output.result || output.result === 'null') &&
          output.console.length) {
        for(var i = 0, l = output.console.length; i < l && i < 5; ++i) {
          ziggy.say(channel, output.console[i])
        }

        return
      }

      if(output.result) {
        output.result = output.result.split('\n').slice(0, 5).join('\n')

        return ziggy.say(channel, output.result)
      }

      ziggy.say(channel, user.nick + ': invalid request!')
    }
  }

  function parsePm(user, message) {
    return parseMessage(user, user.nick, message)
  }
}
