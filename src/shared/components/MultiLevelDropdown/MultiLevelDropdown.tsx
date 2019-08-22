import React from 'react'
import css from './MultiLevelDropdown.css'
import resolveCss from '$shared/utils/resolveCss'
import ItemsList from '$shared/components/MultiLevelDropdown/ItemsList'
import Overlay from '$shared/components/Overlay/Overlay'
import OverlaySection from '$shared/components/Overlay/OverlaySection'

const classes = resolveCss(css)

interface IProps {
  items: IItems
  activePath: string[]
  onClickOutside?: () => void
  onSelect: IMenuAPI['onSelect']
}

interface IState {}

export type IItems = {
  [id: string]: {
    isLeaf: boolean
    isSelectable: boolean
    path: string[]
    internalPath: string[]
    __subItems__: IItems
  }
}

type IMenuAPI = {
  onSelect: (path: string[]) => void
}

export const MenuAPIContext = React.createContext({
  onSelect: () => {},
} as IMenuAPI)

class MultiLevelDropdown extends React.PureComponent<IProps, IState> {
  api: IMenuAPI = {
    onSelect: path => this.props.onSelect(path),
  }

  render() {
    const {onClickOutside, items, activePath} = this.props
    return (
      <MenuAPIContext.Provider value={this.api}>
        <div {...classes('positioner')}>
          <div {...classes('container')}>
            {onClickOutside != null ? (
              <Overlay onClickOutside={onClickOutside}>
                <OverlaySection>
                  <ItemsList items={items} activePath={activePath} />
                </OverlaySection>
              </Overlay>
            ) : (
              <OverlaySection>
                <ItemsList items={items} activePath={activePath} />
              </OverlaySection>
            )}
          </div>
        </div>
      </MenuAPIContext.Provider>
    )
  }
}

export default MultiLevelDropdown
