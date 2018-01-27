// @flow
import originalConnect from 'react-redux/es/connect/connect'
// import {HigherOrderComponent} from 'react-flow-types'
import {IStoreState} from '$studio/types'

export const storeKey = 'theaterJSReduxStore'

const connect = (mapStateToProps: mixed) => {
  return originalConnect(mapStateToProps, undefined, undefined, {storeKey})
}

type SelectorFn<P> = (storeState: IStoreState, ownProps: $FixMe) => P

type ConnectFn = <ProvidedProps>(
  selectorFn: SelectorFn<ProvidedProps>,
) => HigherOrderComponent<{}, ProvidedProps>

export default ((connect as any) as ConnectFn)
