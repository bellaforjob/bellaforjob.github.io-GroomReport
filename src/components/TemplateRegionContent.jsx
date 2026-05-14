import { Fragment, useRef } from 'react'
import {
  BEHAVIOR_RADIO_OPTIONS,
  CONDITION_OPTIONS,
  HEADER_GRID_FIELDS,
  SERVICE_OPTIONS,
  TEMPLATE_REFERENCE,
} from '../config/templateRegions'
import { pixelRectToPercent } from '../utils/regionCoordinates'
import { regionBoxStyle } from '../layout/templateLayout'
import {
  OverlayDateInput,
  OverlayLineInput,
  OverlayTextArea,
} from './overlay/OverlayInputs'
import { OVERLAY_FIELD_IDS, overlayFieldId } from './overlay/overlayFieldIds'
import { BehaviorRadioOtherRow, CheckboxMarksRow, ConditionRadioMarksRow } from './overlay/TemplateCheckboxGroups'
import { otherTextPositionStyle } from './overlay/templateMarkBox'
import { PhotoSlot } from './PhotoSlot'

const PHOTO_CATEGORY_LABEL = Object.freeze({
  ears: 'Ears',
  pawPads: 'Paw pads',
  analArea: 'Anal area',
  clientRequest: 'Client request',
  nails: 'Nails',
  tail: 'Tail',
})

/**
 * Renders controls for one entry from `EDITABLE_REGIONS` in `config/templateRegions.js`.
 */
export function TemplateRegionContent({
  region,
  info,
  spots,
  updateField,
  setInfo,
  selectService,
  toggleCheckboxGroup,
  setSpot,
  fieldInsetStyles = null,
}) {
  const behaviorOtherInputRef = useRef(null)

  switch (region.type) {
    case 'photoSlots':
      return (
        <div className="photo-slots-layer" role="group" aria-label="Before and after grooming photos">
          {region.slots.map(({ id, category, which, rectPx }) => (
            <div
              key={id}
              className="photo-slot-abs-wrap image-placeholder-box photo-slot-on-template"
              style={regionBoxStyle(pixelRectToPercent(rectPx, TEMPLATE_REFERENCE))}
            >
              <PhotoSlot
                slotId={id}
                label={`${PHOTO_CATEGORY_LABEL[category] ?? category} ${which} photo — 相册或相机，也可拖入文件`}
                className="photo-slot--abs"
                src={spots[category]?.[which] ?? null}
                onPick={(file) => setSpot(category, which, file)}
              />
            </div>
          ))}
        </div>
      )

    case 'headerGrid': {
      const headerAbs = HEADER_GRID_FIELDS.some((f) => Boolean(fieldInsetStyles?.[f]))
      return (
        <div className={headerAbs ? 'header-grid header-grid--field-abs' : 'header-grid'}>
          {region.cells.map((cell, index) => {
            if (cell.type === 'spacer') {
              if (headerAbs) return null
              return <div key={`spacer-${index}`} className="header-grid__spacer" aria-hidden />
            }
            const fid = OVERLAY_FIELD_IDS[cell.field]
            if (cell.input === 'date') {
              const inner = (
                <OverlayDateInput
                  fieldId={fid}
                  label={cell.label}
                  value={info[cell.field]}
                  onValueChange={updateField(cell.field)}
                  valueStartPercent={headerAbs ? undefined : cell.valueStartPercent}
                />
              )
              return (
                <Fragment key={cell.field}>
                  {headerAbs ? (
                    <div className="header-grid__cell-abs" style={fieldInsetStyles[cell.field]}>
                      {inner}
                    </div>
                  ) : (
                    inner
                  )}
                </Fragment>
              )
            }
            const innerLine = (
              <OverlayLineInput
                fieldId={fid}
                label={cell.label}
                value={info[cell.field]}
                onValueChange={updateField(cell.field)}
                placeholder={cell.placeholder ?? ' '}
                autoComplete={cell.autoComplete}
                valueStartPercent={headerAbs ? undefined : cell.valueStartPercent}
              />
            )
            return (
              <Fragment key={cell.field}>
                {headerAbs ? (
                  <div className="header-grid__cell-abs" style={fieldInsetStyles[cell.field]}>
                    {innerLine}
                  </div>
                ) : (
                  innerLine
                )}
              </Fragment>
            )
          })}
        </div>
      )
    }

    case 'checkboxGroup':
      return (
        <fieldset className="checkbox-group-fieldset">
          <legend className="visually-hidden">{region.groupLabel}</legend>
          <CheckboxMarksRow
            options={region.options}
            checkSlots={region.checkSlots}
            values={info.checkboxGroups?.[region.groupId] ?? {}}
            onToggle={(key) => toggleCheckboxGroup(region.groupId, key)}
            groupAriaLabel={region.groupLabel}
          />
        </fieldset>
      )

    case 'servicesRadio':
      return (
        <fieldset className="services-fieldset">
          <legend className="visually-hidden">Services provided</legend>
          <BehaviorRadioOtherRow
            name="service"
            radiogroupLabel="Services provided"
            groupClassName="template-checkbox-group--services"
            slots={region.checkSlots}
            behaviorOptions={SERVICE_OPTIONS}
            selectedValue={info.service}
            onSelect={selectService}
            otherText={region.otherText}
            otherValue={info.serviceOther ?? ''}
            onOtherChange={updateField('serviceOther')}
            otherInputAriaLabel="Other service details"
          />
        </fieldset>
      )

    case 'healthBlock': {
      const behaviorRow = region.rows.find((r) => r.kind === 'behaviorRadio')
      return (
        <div className="health-block-root">
          {region.rows.map((row) => {
            if (row.kind === 'conditionRadio') {
              return (
                <div key={row.inputName} className={`health-row health-row--${row.inputName}`}>
                  <span className="health-row__label" aria-hidden="true">
                    {row.rowLabel}
                  </span>
                  <ConditionRadioMarksRow
                    name={row.inputName}
                    radiogroupLabel={row.radiogroupLabel}
                    slots={row.markSlots}
                    conditionOptions={CONDITION_OPTIONS}
                    selectedValue={info[row.stateKey]}
                    onSelect={(v) => setInfo((p) => ({ ...p, [row.stateKey]: v }))}
                  />
                </div>
              )
            }
            if (row.kind === 'behaviorRadio') {
              return (
                <div key={row.inputName} className="health-row health-row--behavior">
                  <span className="health-row__label" aria-hidden="true">
                    {row.rowLabel}
                  </span>
                  <div className="health-row__mark-strip">
                    <BehaviorRadioOtherRow
                      name={row.inputName}
                      radiogroupLabel={row.radiogroupLabel}
                      slots={row.markSlots}
                      behaviorOptions={BEHAVIOR_RADIO_OPTIONS}
                      selectedValue={info[row.stateKey]}
                      onSelect={(v) => setInfo((p) => ({ ...p, [row.stateKey]: v }))}
                      otherText={row.otherText}
                      otherValue={info[row.otherField] ?? ''}
                      onOtherChange={updateField(row.otherField)}
                      groupClassName="template-checkbox-group--behavior template-checkbox-group--health-strip"
                      omitOtherLineInput
                      otherInputExternalRef={behaviorOtherInputRef}
                    />
                  </div>
                </div>
              )
            }
            if (row.kind === 'line') {
              const fid = OVERLAY_FIELD_IDS[row.field]
              return (
                <OverlayLineInput
                  key={row.field}
                  fieldId={fid}
                  label={row.label}
                  value={info[row.field]}
                  onValueChange={updateField(row.field)}
                  className={row.className}
                  placeholder={row.placeholder ?? ' '}
                />
              )
            }
            if (row.kind === 'textarea') {
              const fid = OVERLAY_FIELD_IDS[row.field]
              const notesInset = row.field === 'healthNotes' ? fieldInsetStyles?.healthNotes : null
              const notes = (
                <OverlayTextArea
                  fieldId={fid}
                  label={row.label}
                  value={info[row.field]}
                  onValueChange={updateField(row.field)}
                  rows={row.rows}
                  className="health-block__notes"
                />
              )
              return (
                <Fragment key={row.field}>
                  {notesInset ? (
                    <div className="health-block__notes-abs" style={notesInset}>
                      {notes}
                    </div>
                  ) : (
                    notes
                  )}
                </Fragment>
              )
            }
            return null
          })}
          {behaviorRow ? (
            <input
              ref={behaviorOtherInputRef}
              id={OVERLAY_FIELD_IDS[behaviorRow.otherField]}
              type="text"
              className="template-checkbox-group__other-input template-text template-on-artwork-input health-block-root__behavior-other"
              style={otherTextPositionStyle(behaviorRow.otherText.box)}
              value={info[behaviorRow.otherField] ?? ''}
              onChange={(e) => updateField(behaviorRow.otherField)(e.target.value)}
              placeholder=""
              aria-label="Behavior other details"
              disabled={info[behaviorRow.stateKey] !== 'other'}
              data-overlay-field={OVERLAY_FIELD_IDS[behaviorRow.otherField]}
            />
          ) : null}
        </div>
      )
    }

    case 'textArea': {
      const fid = OVERLAY_FIELD_IDS[region.field]
      const groomerInset = region.field === 'groomerNotes' ? fieldInsetStyles?.groomerNotes : null
      const ta = (
        <OverlayTextArea
          fieldId={fid}
          label={region.label}
          value={info[region.field]}
          onValueChange={updateField(region.field)}
          rows={region.rows}
          className={region.className}
          valueStartPercent={groomerInset ? undefined : region.valueStartPercent}
          valueTopPercent={groomerInset ? undefined : region.valueTopPercent}
        />
      )
      return groomerInset ? (
        <div className="groomer-notes-abs-field" style={groomerInset}>
          {ta}
        </div>
      ) : (
        ta
      )
    }

    case 'lineInput': {
      const fid = OVERLAY_FIELD_IDS[region.field]
      const apptInset = region.field === 'nextAppointment' ? fieldInsetStyles?.nextAppointment : null
      const li = (
        <OverlayLineInput
          fieldId={fid}
          label={region.label}
          value={info[region.field]}
          onValueChange={updateField(region.field)}
          className={region.className}
          placeholder={region.placeholder ?? ' '}
          valueStartPercent={apptInset ? undefined : region.valueStartPercent}
        />
      )
      return apptInset ? (
        <div className="footer-appointment-abs-field" style={apptInset}>
          {li}
        </div>
      ) : (
        li
      )
    }

    case 'absoluteTextFields':
      return (
        <>
          {region.fields.map((f) => {
            const fid = overlayFieldId(f.field)
            const boxStyle = regionBoxStyle(f.boxPercent)
            if (f.input === 'textarea') {
              return (
                <div key={f.field} className="template-abs-field" style={boxStyle}>
                  <OverlayTextArea
                    fieldId={fid}
                    label={f.label}
                    value={info[f.field] ?? ''}
                    onValueChange={updateField(f.field)}
                    rows={f.rows ?? 2}
                    className={f.className ?? ''}
                  />
                </div>
              )
            }
            return (
              <div key={f.field} className="template-abs-field" style={boxStyle}>
                <OverlayLineInput
                  fieldId={fid}
                  label={f.label}
                  value={info[f.field] ?? ''}
                  onValueChange={updateField(f.field)}
                  className={f.className ?? ''}
                  placeholder={f.placeholder ?? ' '}
                />
              </div>
            )
          })}
        </>
      )

    default:
      return null
  }
}
