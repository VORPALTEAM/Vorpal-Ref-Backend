import md5 from 'md5'

export const generateLink = ( address : string ) => {
    const message = address + "" + (new Date().getTime()) + (Math.random() * 1000000000)
    return md5(message)
}
