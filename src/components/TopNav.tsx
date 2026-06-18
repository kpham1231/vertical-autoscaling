import { palette } from '@leafygreen-ui/palette'
import { css } from '@leafygreen-ui/emotion'
import Icon from '@leafygreen-ui/icon'
import IconButton from '@leafygreen-ui/icon-button'

const topNavStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  background: ${palette.white};
  border-bottom: 1px solid ${palette.gray.light2};
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
`

const breadcrumbStyles = css`
  display: flex;
  align-items: center;
  gap: 0;
`

const breadcrumbSegmentStyles = css`
  display: flex;
  flex-direction: column;
  gap: 1px;
`

const breadcrumbLabelStyles = css`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${palette.gray.base};
  line-height: 1;
`

const activeBreadcrumbLabelStyles = css`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${palette.green.dark2};
  line-height: 1;
`

const breadcrumbValueStyles = css`
  font-size: 13px;
  font-weight: 400;
  color: ${palette.gray.dark3};
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
`

const activeBreadcrumbValueStyles = css`
  font-size: 13px;
  font-weight: 700;
  color: ${palette.black};
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
`

const separatorStyles = css`
  color: ${palette.gray.light1};
  font-size: 16px;
  margin: 0 10px;
  line-height: 1;
  padding-top: 6px;
`

const rightActionsStyles = css`
  display: flex;
  align-items: center;
  gap: 4px;
`

const avatarStyles = css`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${palette.green.dark2};
  color: ${palette.white};
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  cursor: pointer;
  flex-shrink: 0;
`

export function TopNav({ showWorkspace = true, activeProject = false }: { showWorkspace?: boolean; activeProject?: boolean }) {
  return (
    <div className={topNavStyles}>
      <div className={breadcrumbStyles}>
        <div className={breadcrumbSegmentStyles}>
          <span className={breadcrumbLabelStyles}>Organization</span>
          <span className={breadcrumbValueStyles}>org-1</span>
        </div>

        <span className={separatorStyles}>›</span>

        <div className={breadcrumbSegmentStyles}>
          <span className={activeProject ? activeBreadcrumbLabelStyles : breadcrumbLabelStyles}>Project</span>
          <span className={activeProject ? activeBreadcrumbValueStyles : breadcrumbValueStyles}>project-1</span>
        </div>

        {showWorkspace && (
          <>
            <span className={separatorStyles}>›</span>
            <div className={breadcrumbSegmentStyles}>
              <span className={activeBreadcrumbLabelStyles}>Stream Processing Workspace</span>
              <span className={activeBreadcrumbValueStyles}>
                wksp1
                <Icon glyph="CaretDown" size="small" />
              </span>
            </div>
          </>
        )}
      </div>

      <div className={rightActionsStyles}>
        <IconButton aria-label="Search">
          <Icon glyph="MagnifyingGlass" />
        </IconButton>
        <IconButton aria-label="Help">
          <Icon glyph="QuestionMarkWithCircle" />
        </IconButton>
        <IconButton aria-label="User">
          <Icon glyph="Person" />
        </IconButton>
        <IconButton aria-label="Notifications">
          <Icon glyph="Bell" />
        </IconButton>
        <IconButton aria-label="Apps">
          <Icon glyph="Apps" />
        </IconButton>
        <div className={avatarStyles}>S</div>
      </div>
    </div>
  )
}
