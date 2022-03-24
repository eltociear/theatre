import type {Keyframe} from '@theatre/core/projects/store/types/SheetState_Historic'
import {usePrism} from '@theatre/react'
import {val} from '@theatre/dataverse'
import React from 'react'
import styled from 'styled-components'
import KeyframeEditor from './KeyframeEditor/KeyframeEditor'
import useContextMenu from '@theatre/studio/uiComponents/simpleContextMenu/useContextMenu'
import useRefAndState from '@theatre/studio/utils/useRefAndState'
import getStudio from '@theatre/studio/getStudio'

const Container = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`

type IProps = Parameters<typeof KeyframeEditor>[0]

const BasicKeyframedTrack: React.FC<IProps> = React.memo((props) => {
  const {layoutP, trackData, leaf} = props
  const [containerRef, containerNode] = useRefAndState<HTMLDivElement | null>(
    null,
  )
  const {selectedKeyframeIds, selection} = usePrism(() => {
    const selectionAtom = val(layoutP.selectionAtom)
    const selectedKeyframeIds = val(
      selectionAtom.pointer.current.byObjectKey[
        leaf.sheetObject.address.objectKey
      ].byTrackId[leaf.trackId].byKeyframeId,
    )
    if (selectedKeyframeIds) {
      return {
        selectedKeyframeIds,
        selection: val(selectionAtom.pointer.current),
      }
    } else {
      return {selectedKeyframeIds: {}, selection: undefined}
    }
  }, [layoutP, leaf.trackId])

  const [contextMenu, _, isOpen] = useBasicKeyframedTrackContextMenu(
    containerNode,
    props,
  )

  const keyframeEditors = trackData.keyframes.map((kf, index) => (
    <KeyframeEditor
      keyframe={kf}
      index={index}
      trackData={trackData}
      layoutP={layoutP}
      leaf={leaf}
      key={'keyframe-' + kf.id}
      selection={selectedKeyframeIds[kf.id] === true ? selection : undefined}
    />
  ))

  return (
    <Container
      ref={containerRef}
      style={{
        background: isOpen ? '#444850 ' : 'unset',
      }}
    >
      {keyframeEditors}
      {contextMenu}
    </Container>
  )
})

export default BasicKeyframedTrack

const earliestKeyframe = (keyframes: Keyframe[]) => {
  let curEarliest: Keyframe | null = null
  for (const keyframe of keyframes) {
    if (curEarliest === null || keyframe.position < curEarliest.position) {
      curEarliest = keyframe
    }
  }
  return curEarliest
}

const pasteKeyframesContextMenuItem = (
  props: IProps,
  keyframes: Keyframe[],
) => ({
  label: 'Paste Keyframes',
  callback: () => {
    const sheet = val(props.layoutP.sheet)
    const sequence = sheet.getSequence()

    getStudio()!.transaction(({stateEditors}) => {
      sequence.position = sequence.closestGridPosition(sequence.position)
      const keyframeOffset = earliestKeyframe(keyframes)?.position!

      for (const keyframe of keyframes) {
        stateEditors.coreByProject.historic.sheetsById.sequence.setKeyframeAtPosition(
          {
            ...props.leaf.sheetObject.address,
            trackId: props.leaf.trackId,
            position: sequence.position + keyframe.position - keyframeOffset,
            value: keyframe.value,
            snappingFunction: sequence.closestGridPosition,
          },
        )
      }
    })
  },
})

function useBasicKeyframedTrackContextMenu(
  node: HTMLDivElement | null,
  props: IProps,
) {
  return useContextMenu(node, {
    items: () => {
      const selectionKeyframes =
        val(getStudio()!.atomP.ahistoric.clipboard.keyframes) || []

      if (selectionKeyframes.length > 0) {
        return [pasteKeyframesContextMenuItem(props, selectionKeyframes)]
      } else {
        return []
      }
    },
  })
}
