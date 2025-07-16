/*#if _EVM

import { getWallets, wallets } from '@depay/web3-wallets-evm'

/*#elif _SOLANA

import { getWallets, wallets } from '@depay/web3-wallets-solana'

//#else */

import { getWallets, wallets } from '@depay/web3-wallets'

//#endif

import allWalletsOriginal from '../helpers/allWallets'
import ConfigurationContext from '../contexts/ConfigurationContext'
import Dialog from '../components/Dialog'
import DropDown from '../components/DropDown'
import isMobile from '../helpers/isMobile'
import MenuIcon from '../components/MenuIcon'
import platformForWallet from '../helpers/platformForWallet'
import React, { useState, useEffect, useContext, useRef, useMemo } from 'react'
import safeUniversalUrl from '../helpers/safeUniversalUrl'
import SelectWalletList from '../components/SelectWalletList'
import { get as getPreviouslyConnectedWallet } from '../helpers/previouslyConnectedWallet'
import { NavigateStackContext } from '@depay/react-dialog-stack'

export default (props)=>{

  const [ searchTerm, setSearchTerm ] = useState('')
  const [ detectedWallets, setDetectedWallets ] = useState([])
  const [ previouslyConnectedWallet, setPreviouslyConnectedWallet ] = useState()
  const [ showDropDown, setShowDropDown ] = useState(false)
  const [ dialogAnimationFinished, setDialogAnimationFinished ] = useState(false)
  const { wallets: walletsConfiguration } = useContext(ConfigurationContext)
  const searchElement = useRef()
  const { navigate } = useContext(NavigateStackContext)

  let allWallets
  if(walletsConfiguration?.sort || walletsConfiguration?.whitelist) {
    allWallets = useMemo(()=>{
      let adjustedWallets = [...allWalletsOriginal]

      if(walletsConfiguration?.sort) {
        walletsConfiguration.sort.forEach((sortedWallet, newIndex)=>{
          let currentListIndex = adjustedWallets.findIndex((unsortedWallet)=>unsortedWallet.name === sortedWallet)
          if(currentListIndex > -1) {
            adjustedWallets.splice(newIndex, 0, adjustedWallets.splice(currentListIndex, 1)[0])
          }
        })
      }

      if(walletsConfiguration?.whitelist) {
        adjustedWallets = adjustedWallets.filter((wallet)=>walletsConfiguration.whitelist.indexOf(wallet.name) > -1)
      }

      return adjustedWallets
    }, [walletsConfiguration])
  } else {
    allWallets = allWalletsOriginal
  }

  const onClickWallet = (walletMetaData, wallet)=>{
    if(walletMetaData.via == 'detected') {
      if(walletMetaData.connectionType == 'app') {
        wallet.account().then((account)=>{
          if(account){
            props.resolve(account, wallet)
          }
        })
        props.setWallet(walletMetaData)
        navigate('ConnectWallet')
      } else if(walletMetaData.connectionType == 'extension') {
        props.setWallet(walletMetaData)
        props.connectExtension(walletMetaData)
        navigate('ConnectWallet')
      }
    } else if(isMobile()) {
      const platform = platformForWallet(walletMetaData)
      if(platform && platform.open) {
        props.openInApp(walletMetaData)
        props.setWallet(walletMetaData)
        navigate('ConnectWallet')
      } else {
        props.connectViaRedirect(walletMetaData)
        props.setWallet(walletMetaData)
        navigate('ConnectWallet')
      }
    } else {
      props.setWallet(walletMetaData)
      navigate('ConnectWallet')
    }
  }

  useEffect(()=>{
    if(allWallets.length === 1) {
      onClickWallet(allWallets[0])
    }
  }, [allWallets])

  useEffect(()=>{
    if(detectedWallets.length == 1) {
      const wallet = allWallets.find((wallet)=>wallet.name === detectedWallets[0].info.name)
      if(wallet.autoSelect) {
        onClickWallet(wallet)
      }
    }
  }, [detectedWallets])

  useEffect(()=>{
    let wallets = []
    getWallets({
      drip: (wallet)=>{
        wallets = wallets.concat(wallet)
        
        if(walletsConfiguration?.sort || walletsConfiguration?.whitelist) {
          let adjustedWallets = [...wallets]

          if(walletsConfiguration?.sort) {
            walletsConfiguration.sort.forEach((sortedWallet, newIndex)=>{
              let currentListIndex = adjustedWallets.findIndex((unsortedWallet)=>unsortedWallet?.info?.name === sortedWallet)
              if(currentListIndex > -1) {
                adjustedWallets.splice(newIndex, 0, adjustedWallets.splice(currentListIndex, 1)[0])
              }
            })
          }

          if(walletsConfiguration?.whitelist) {
            adjustedWallets = adjustedWallets.filter((wallet)=>walletsConfiguration.whitelist.indexOf(wallet?.info?.name) > -1)
          }

          setDetectedWallets(adjustedWallets)
        } else {
          setDetectedWallets(wallets)
        }
      }
    })

    let previouslyConnectedWalletName = getPreviouslyConnectedWallet()
    let previouslyConnectedWallet = allWallets.find((wallet)=>wallet.name == previouslyConnectedWalletName) || allWallets.find((wallet)=>wallet.name == previouslyConnectedWalletName)
    if(previouslyConnectedWallet) {
      setPreviouslyConnectedWallet(previouslyConnectedWallet)
    }
  }, [])

  useEffect(()=>{
    setTimeout(()=>{
      setDialogAnimationFinished(true)
      if(!isMobile()) {
        if(searchElement.current){
          searchElement.current.click()
          searchElement.current.focus()
        }
      }
    }, 200)
  }, [])

  return(
    <Dialog
      header={
        <div className="PaddingTopM">
          <div className="PaddingTopS PaddingLeftM PaddingRightM TextLeft PaddingBottomS">
            <h1 className="LineHeightL FontSizeL PaddingBottomS FontWeightMedium">Connect a wallet</h1>
            <p style={{ fontSize: '14px', color: 'rgba(20, 24, 31, 0.45)', lineHeight: '20px' }}>
              Some extension wallets may automatically connect to dapps by default. 
              Please close the extension wallet and then refresh the webpage.
            </p>
          </div>
          { ((detectedWallets && detectedWallets.length > 0) || previouslyConnectedWallet) &&
            <div className="PaddingBottomXS PaddingLeftS PaddingRightS">
              {
                detectedWallets.filter((wallet, index, array)=>{
                  return array.findIndex(target => (target?.info?.name === wallet?.info?.name)) === index
                }).map((wallet, index)=>{
                  const walletMetaData = allWallets.find((walletFromList)=>walletFromList.name === (wallet.info ? wallet.info.name : wallet.name))
                  if(!walletMetaData){ return null }
                  let connectionType = 'app'
                  if(wallet && wallet.constructor && ![wallets.WalletConnectV1, wallets.WalletConnectV2, wallets.WalletLink].includes(wallet.constructor)) {
                    connectionType = 'extension'
                  }
                  return(
                    <div key={index} style={{ marginBottom: '8px' }}>
                      <button
                        type="button"
                        className="Card small"
                        title={`Connect ${walletMetaData.name}`}
                        onClick={ ()=>{
                          onClickWallet({ ...walletMetaData, via: 'detected', connectionType }, wallet)
                        }}
                      >
                        <div className="CardImage">
                          <img className="transparent" src={walletMetaData.logo} className="WalletLogoS"/>
                        </div>
                        <div className="CardBody">
                          <div className="CardBodyWrapper PaddingLeftXS LineHeightXS">
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>
                              { walletMetaData.name }
                            </div>
                            <div className="LightGreen" style={{ fontSize: '12px' }}><span className="LightGreen" style={{ fontSize: '12px', top: '-1px', position: 'relative' }}>●</span> Connect detected { connectionType }</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  )
                })
              }
              {
                previouslyConnectedWallet && !detectedWallets.find((wallet)=>previouslyConnectedWallet.name === (wallet.info ? wallet.info.name : wallet.name)) &&
                <div style={{ marginBottom: '8px' }}>
                  <button
                    type="button"
                    className="Card small"
                    title={`Connect ${previouslyConnectedWallet.name}`}
                    onClick={ ()=>{
                      onClickWallet({ ...previouslyConnectedWallet, via: 'previouslyConnected', connectionType: 'app' })
                    }}
                  >
                    <div className="CardImage">
                      <img className="transparent" src={previouslyConnectedWallet.logo} className="WalletLogoS"/>
                    </div>
                    <div className="CardBody">
                      <div className="CardBodyWrapper PaddingLeftXS LineHeightXS">
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          { previouslyConnectedWallet.name }
                        </div>
                        <div className="Opacity05" style={{ fontSize: '12px' }}><span style={{ fontSize: '12px', top: '-1px', position: 'relative' }}>●</span> Used previously</div>
                      </div>
                    </div>
                  </button>
                </div>
              }
            </div>
          }
          <div className="PaddingBottomS PaddingLeftS PaddingRightS PaddingTopXS">
            <div className="Row">
              { allWallets.length > 4 &&
                <input className="Search small" value={ searchTerm } onChange={ (event)=>{ setSearchTerm(event.target.value) } } placeholder="Search by name" ref={ searchElement }/>
              }
            </div>
          </div>
        </div>
      }
      alternativeHeaderAction={
        <></>
      }
      bodyClassName={ "PaddingBottomXS" }
      body={
        <div className="ScrollHeightM PaddingTopXS">
          { dialogAnimationFinished &&
            <SelectWalletList setWallet={ props.setWallet } searchTerm={ searchTerm } onClickWallet={ onClickWallet }/>
          }
        </div>
      }
      footer={ false }
    />
  )
}
