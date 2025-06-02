const link = ({ url, target, wallet })=>{

  if(url && url.length && target == '_blank' && wallet?.name === 'World App' && url.match('unuspay.com')) {
    return `https://integrate.unuspay.fi/redirect?to=${encodeURIComponent(url)}`
  }

  return url
}

export default link
