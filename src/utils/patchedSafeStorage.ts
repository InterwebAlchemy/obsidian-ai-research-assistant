import { around } from 'monkey-around'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Electron = require('electron')

const {
  remote: { safeStorage }
} = Electron

const unpatchSafeStorage = around(safeStorage, {
  decryptString(oldMethod) {
    return function (
      encryptedString = Buffer.from(''),
      valueName = 'a stored secret',
      requesterName = 'a plugin'
    ) {
      const shouldDecrypt = confirm(
        `WARNING: ${requesterName} is trying to decrypt ${valueName}. Would you like to allow this action?`
      )

      if (!shouldDecrypt) {
        console.error(`${requesterName} was denied access to ${valueName}`)

        return ''
      } else {
        console.log('DECRYPTING:', encryptedString)

        // TODO: figure out why this call fails with "Error: Expected the first argument of decryptString() to be a buffer" even when Buffer.from(string) is used
        return (
          Buffer.isBuffer(encryptedString) &&
          oldMethod?.apply(this, encryptedString)
        )
      }
    }
  }
})

export default unpatchSafeStorage
