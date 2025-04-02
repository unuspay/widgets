import link from '../helpers/link'
import React, { useContext, useEffect } from 'react'
import WalletContext from '../contexts/WalletContext'

export default ()=>{
  const walletContext = useContext(WalletContext)
  const wallet = walletContext ? walletContext.wallet : undefined

  return(
    <div className="PoweredByWrapper">
      <a href={ link({ url: 'https://unuspay.com', target: '_blank', wallet }) } rel="noopener noreferrer" target="_blank" className="PoweredByLink">by UnusPay</a>
    </div>
  )
}
