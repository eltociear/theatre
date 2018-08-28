import {MapKey} from '$shared/DataVerse/types'
import AbstractDerivation from './AbstractDerivation'
import {DictAtom} from '../atoms/dictAtom'
import {ArrayAtom} from '$shared/DataVerse/atoms/arrayAtom'
import AbstractDerivedDict from '$shared/DataVerse/derivations/dicts/AbstractDerivedDict'
import AbstractDerivedArray from './arrays/AbstractDerivedArray'
import DerivedClassInstance from '../derivedClass/DerivedClassInstance'
import {
  DerivationTypeOfPointerType,
  IndexOfPointer,
  PropOfPointer,
  PointerKeys,
} from './pointerTypes'

const noBoxAtoms = (v: $IntentionalAny) => {
  if (v instanceof modules.box.BoxAtom) {
    return modules.deriveFromBoxAtom.default(v).flatMap(noBoxAtoms)
  } else {
    return v
  }
}

type Root =
  | DictAtom<mixed>
  | ArrayAtom<mixed>
  | AbstractDerivedDict<mixed>
  | AbstractDerivedArray<mixed>
  | DerivedClassInstance<mixed>

type Address =
  | {
      type: 'WithPath'
      root: Root
      path: Array<MapKey>
    }
  | {
      type: 'fromParentPointer'
      parentPointer: PointerDerivation<$IntentionalAny>
      keyOrIndex: number | string
    }

export class PointerDerivation<V> extends AbstractDerivation<
  DerivationTypeOfPointerType<V>
> {
  v: V
  static NOTFOUND: void = undefined
  isPointer = true
  _address: Address
  _internalDerivation: undefined | null | AbstractDerivation<$IntentionalAny>
  _props: {[K in $IntentionalAny]: PointerDerivation<$IntentionalAny>}

  constructor(address: Address) {
    super()
    this._address = address
    this._internalDerivation = undefined
    this._props = {}
  }

  prop<K extends PointerKeys<V>>(key: K): PropOfPointer<V, K> {
    if (!this._props[key]) {
      this._props[key] = new PointerDerivation({
        type: 'fromParentPointer',
        parentPointer: this,
        keyOrIndex: key as $IntentionalAny,
      })
    }
    return this._props[key] as $IntentionalAny
  }

  index(key: number): IndexOfPointer<V> {
    if (!this._props[key]) {
      this._props[key] = new PointerDerivation({
        type: 'fromParentPointer',
        parentPointer: this,
        keyOrIndex: key,
      })
    }
    return this._props[key] as $IntentionalAny
  }

  _makeDerivation() {
    const address = this._address
    const d =
      address.type === 'fromParentPointer'
        ? this._makeDerivationForParentPointer(
            address.parentPointer,
            address.keyOrIndex,
          )
        : this._makeDerivationForPath(address.root, address.path)

    this._addDependency(d)

    return d
  }

  _makeDerivationForParentPointer(
    parentPointer: PointerDerivation<$IntentionalAny>,
    keyOrIndex: string | number,
  ) {
    const d = parentPointer
      .flatMap(p => propify(p, keyOrIndex))
      .flatMap(noBoxAtoms)

    return d
  }

  _makeDerivationForPath(root: Root, path: Array<string | number>) {
    let finalDerivation = modules.constant.default(root) as AbstractDerivation<
      $IntentionalAny
    >
    path.forEach(key => {
      finalDerivation = finalDerivation.flatMap(p => propify(p, key))
    })

    finalDerivation = finalDerivation.flatMap(noBoxAtoms)
    return finalDerivation
  }

  _getInternalDerivation(): AbstractDerivation<$IntentionalAny> {
    if (!this._internalDerivation) {
      this._internalDerivation = this._makeDerivation()
    }
    return this._internalDerivation
  }

  _recalculate() {
    return this._getInternalDerivation().getValue()
  }

  _keepUptodate() {
    this.getValue()
  }

  pointer(): this {
    return this
  }
}

const _propify = (
  possibleReactiveValue: $IntentionalAny,
  key: string | number,
) => {
  if (
    possibleReactiveValue === PointerDerivation.NOTFOUND ||
    possibleReactiveValue === undefined
  ) {
    return PointerDerivation.NOTFOUND
  } else if (possibleReactiveValue instanceof modules.dict.DictAtom) {
    return modules.deriveFromPropOfADictAtom.default(possibleReactiveValue, key)
  } else if (
    possibleReactiveValue instanceof modules.array.ArrayAtom &&
    typeof key === 'number'
  ) {
    return modules.deriveFromIndexOfArrayAtom.default(
      possibleReactiveValue,
      key,
    )
  } else if (
    possibleReactiveValue instanceof modules.DerivedClassInstance.default ||
    possibleReactiveValue instanceof PointerDerivation ||
    possibleReactiveValue instanceof modules.AbstractDerivedDict.default
  ) {
    return possibleReactiveValue.prop(key)
  } else if (possibleReactiveValue.isDerivedArray === true) {
    return possibleReactiveValue.index(key)
  } else {
    return undefined
  }
}

const propify = (
  possibleReactiveValue: $IntentionalAny,
  key: string | number,
) => {
  const d = _propify(possibleReactiveValue, key)
  return d
}

export default function pointer(address: Address): mixed {
  return new PointerDerivation(address)
}

const modules = {
  constant: require('./constant'),
  deriveFromPropOfADictAtom: require('./ofAtoms/deriveFromPropOfADictAtom'),
  deriveFromIndexOfArrayAtom: require('./ofAtoms/deriveFromIndexOfArrayAtom'),
  deriveFromBoxAtom: require('./ofAtoms/deriveFromBoxAtom'),
  DerivedClassInstance: require('$shared/DataVerse/derivedClass/DerivedClassInstance'),
  AbstractDerivedDict: require('./dicts/AbstractDerivedDict'),
  box: require('$shared/DataVerse/atoms/boxAtom'),
  dict: require('$shared/DataVerse/atoms/dictAtom'),
  array: require('$shared/DataVerse/atoms/arrayAtom'),
}
