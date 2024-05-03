import {DashboardFixture} from 'sentry-fixture/dashboard';
import {LocationFixture} from 'sentry-fixture/locationFixture';
import {OrganizationFixture} from 'sentry-fixture/organization';
import {ProjectFixture} from 'sentry-fixture/project';
import {ReleaseFixture} from 'sentry-fixture/release';
import {RouteComponentPropsFixture} from 'sentry-fixture/routeComponentPropsFixture';
import {WidgetFixture} from 'sentry-fixture/widget';

import {initializeOrg} from 'sentry-test/initializeOrg';
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from 'sentry-test/reactTestingLibrary';

import * as modals from 'sentry/actionCreators/modal';
import ProjectsStore from 'sentry/stores/projectsStore';
import {browserHistory} from 'sentry/utils/browserHistory';
import CreateDashboard from 'sentry/views/dashboards/create';
import * as types from 'sentry/views/dashboards/types';
import ViewEditDashboard from 'sentry/views/dashboards/view';
import {OrganizationContext} from 'sentry/views/organizationContext';

describe('Dashboards > Detail', function () {
  const organization = OrganizationFixture({
    features: ['global-views', 'dashboards-basic', 'dashboards-edit', 'discover-query'],
  });
  const projects = [ProjectFixture()];

  describe('prebuilt dashboards', function () {
    let initialData;

    beforeEach(function () {
      act(() => ProjectsStore.loadInitialData(projects));
      initialData = initializeOrg({organization});

      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/tags/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/projects/',
        body: [ProjectFixture()],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/',
        body: [
          DashboardFixture([], {id: 'default-overview', title: 'Default'}),
          DashboardFixture([], {id: '1', title: 'Custom Errors'}),
        ],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/default-overview/',
        body: DashboardFixture([], {id: 'default-overview', title: 'Default'}),
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/visit/',
        method: 'POST',
        body: [],
        statusCode: 200,
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/users/',
        method: 'GET',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/sdk-updates/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/prompts-activity/',
        body: {},
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events/',
        method: 'GET',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events-stats/',
        body: {data: []},
      });
      MockApiClient.addMockResponse({
        method: 'GET',
        url: '/organizations/org-slug/issues/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/metrics/meta/',
        body: [],
      });
    });

    afterEach(function () {
      MockApiClient.clearMockResponses();
    });

    it('assigns unique IDs to all widgets so grid keys are unique', async function () {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events-stats/',
        body: {data: []},
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/default-overview/',
        body: DashboardFixture(
          [
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:error',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'Default Widget 1',
              interval: '1d',
            }),
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:transaction',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'Default Widget 2',
              interval: '1d',
            }),
          ],
          {id: 'default-overview', title: 'Default'}
        ),
      });
      initialData = initializeOrg({
        organization: OrganizationFixture({
          features: ['global-views', 'dashboards-basic', 'discover-query'],
          projects: [ProjectFixture()],
        }),
      });

      render(
        <OrganizationContext.Provider value={initialData.organization}>
          <ViewEditDashboard
            {...RouteComponentPropsFixture()}
            organization={initialData.organization}
            params={{orgId: 'org-slug', dashboardId: 'default-overview'}}
            router={initialData.router}
            location={initialData.router.location}
          >
            {null}
          </ViewEditDashboard>
        </OrganizationContext.Provider>,
        {context: initialData.routerContext}
      );

      expect(await screen.findByText('Default Widget 1')).toBeInTheDocument();
      expect(screen.getByText('Default Widget 2')).toBeInTheDocument();
    });

    it('opens the widget viewer modal in a prebuilt dashboard using the widget id specified in the url', async () => {
      const openWidgetViewerModal = jest.spyOn(modals, 'openWidgetViewerModal');

      render(
        <CreateDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{templateId: 'default-template', widgetId: '2'}}
          router={initialData.router}
          location={{...initialData.router.location, pathname: '/widget/2/'}}
        >
          {null}
        </CreateDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await waitFor(() => {
        expect(openWidgetViewerModal).toHaveBeenCalledWith(
          expect.objectContaining({
            organization: initialData.organization,
            widget: expect.objectContaining({
              displayType: 'line',
              interval: '5m',
              queries: [
                {
                  aggregates: ['count()'],
                  columns: [],
                  conditions: '!event.type:transaction',
                  fields: ['count()'],
                  name: 'Events',
                  orderby: 'count()',
                },
              ],
              title: 'Events',
              widgetType: types.WidgetType.DISCOVER,
            }),
            onClose: expect.anything(),
          })
        );
      });
    });
  });

  describe('custom dashboards', function () {
    let initialData, widgets, mockVisit, mockPut;

    beforeEach(function () {
      window.confirm = jest.fn();
      initialData = initializeOrg({
        organization,
        router: {
          location: LocationFixture(),
        },
      });
      widgets = [
        WidgetFixture({
          queries: [
            {
              name: '',
              conditions: 'event.type:error',
              fields: ['count()'],
              columns: [],
              aggregates: ['count()'],
              orderby: '-count()',
            },
          ],
          title: 'Errors',
          interval: '1d',
          widgetType: types.WidgetType.DISCOVER,
          id: '1',
        }),
        WidgetFixture({
          queries: [
            {
              name: '',
              conditions: 'event.type:transaction',
              fields: ['count()'],
              columns: [],
              aggregates: ['count()'],
              orderby: '-count()',
            },
          ],
          title: 'Transactions',
          interval: '1d',
          widgetType: types.WidgetType.DISCOVER,
          id: '2',
        }),
        WidgetFixture({
          queries: [
            {
              name: '',
              conditions: 'event.type:transaction transaction:/api/cats',
              fields: ['p50()'],
              columns: [],
              aggregates: ['p50()'],
              orderby: '-p50()',
            },
          ],
          title: 'p50 of /api/cats',
          interval: '1d',
          id: '3',
        }),
      ];
      mockVisit = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/visit/',
        method: 'POST',
        body: [],
        statusCode: 200,
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/tags/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/projects/',
        body: [ProjectFixture()],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/',
        body: [
          {
            ...DashboardFixture([], {
              id: 'default-overview',
              title: 'Default',
            }),
            widgetDisplay: ['area'],
          },
          {
            ...DashboardFixture([], {
              id: '1',
              title: 'Custom Errors',
            }),
            widgetDisplay: ['area'],
          },
        ],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          title: 'Custom Errors',
          filters: {},
        }),
      });
      mockPut = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        method: 'PUT',
        body: DashboardFixture(widgets, {id: '1', title: 'Custom Errors'}),
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events-stats/',
        body: {data: []},
      });
      MockApiClient.addMockResponse({
        method: 'POST',
        url: '/organizations/org-slug/dashboards/widgets/',
        body: [],
      });
      MockApiClient.addMockResponse({
        method: 'GET',
        url: '/organizations/org-slug/recent-searches/',
        body: [],
      });
      MockApiClient.addMockResponse({
        method: 'GET',
        url: '/organizations/org-slug/issues/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events/',
        method: 'GET',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/users/',
        method: 'GET',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/sdk-updates/',
        body: [],
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/prompts-activity/',
        body: {},
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/metrics/meta/',
        body: [],
      });
    });

    afterEach(function () {
      MockApiClient.clearMockResponses();
      jest.clearAllMocks();
    });

    it('can remove widgets', async function () {
      const updateMock = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        method: 'PUT',
        body: DashboardFixture([widgets[0]], {id: '1', title: 'Custom Errors'}),
      });
      render(
        <OrganizationContext.Provider value={initialData.organization}>
          <ViewEditDashboard
            {...RouteComponentPropsFixture()}
            organization={initialData.organization}
            params={{orgId: 'org-slug', dashboardId: '1'}}
            router={initialData.router}
            location={initialData.router.location}
          >
            {null}
          </ViewEditDashboard>
        </OrganizationContext.Provider>,
        {context: initialData.routerContext}
      );

      await waitFor(() => expect(mockVisit).toHaveBeenCalledTimes(1));

      // Enter edit mode.
      await userEvent.click(screen.getByRole('button', {name: 'Edit Dashboard'}));

      // Remove the second and third widgets
      await userEvent.click(screen.getAllByRole('button', {name: 'Delete Widget'})[1]);
      await userEvent.click(screen.getAllByRole('button', {name: 'Delete Widget'})[1]);

      // Save changes
      await userEvent.click(screen.getByRole('button', {name: 'Save and Finish'}));

      expect(updateMock).toHaveBeenCalled();
      expect(updateMock).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/1/',
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Custom Errors',
            widgets: [expect.objectContaining(widgets[0])],
          }),
        })
      );

      // Visit should not be called again on dashboard update
      expect(mockVisit).toHaveBeenCalledTimes(1);
    });

    it('appends dashboard-level filters to series request', async function () {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          title: 'Custom Errors',
          filters: {release: ['abc@1.2.0']},
        }),
      });
      const mock = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/events-stats/',
        body: [],
      });

      render(
        <OrganizationContext.Provider value={initialData.organization}>
          <ViewEditDashboard
            {...RouteComponentPropsFixture()}
            organization={initialData.organization}
            params={{orgId: 'org-slug', dashboardId: '1'}}
            router={initialData.router}
            location={initialData.router.location}
          >
            {null}
          </ViewEditDashboard>
        </OrganizationContext.Provider>,
        {context: initialData.routerContext}
      );

      await waitFor(() =>
        expect(mock).toHaveBeenLastCalledWith(
          '/organizations/org-slug/events-stats/',
          expect.objectContaining({
            query: expect.objectContaining({
              query: 'event.type:transaction transaction:/api/cats release:"abc@1.2.0" ',
            }),
          })
        )
      );
    });

    it('shows add widget option', async function () {
      render(
        <OrganizationContext.Provider value={initialData.organization}>
          <ViewEditDashboard
            {...RouteComponentPropsFixture()}
            organization={initialData.organization}
            params={{orgId: 'org-slug', dashboardId: '1'}}
            router={initialData.router}
            location={initialData.router.location}
          >
            {null}
          </ViewEditDashboard>
        </OrganizationContext.Provider>,
        {context: initialData.routerContext}
      );

      // Enter edit mode.
      await userEvent.click(screen.getByRole('button', {name: 'Edit Dashboard'}));
      expect(await screen.findByRole('button', {name: 'Add widget'})).toBeInTheDocument();
    });

    it('shows top level release filter', async function () {
      const mockReleases = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [ReleaseFixture()],
      });

      initialData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
          projects: [ProjectFixture()],
        }),
      });

      render(
        <OrganizationContext.Provider value={initialData.organization}>
          <ViewEditDashboard
            {...RouteComponentPropsFixture()}
            organization={initialData.organization}
            params={{orgId: 'org-slug', dashboardId: '1'}}
            router={initialData.router}
            location={initialData.router.location}
          >
            {null}
          </ViewEditDashboard>
        </OrganizationContext.Provider>,
        {context: initialData.routerContext}
      );
      expect(await screen.findByText('All Releases')).toBeInTheDocument();
      expect(mockReleases).toHaveBeenCalledTimes(1);
    });

    it('hides add widget option', async function () {
      // @ts-expect-error this is assigning to readonly property...
      types.MAX_WIDGETS = 1;

      render(
        <OrganizationContext.Provider value={initialData.organization}>
          <ViewEditDashboard
            {...RouteComponentPropsFixture()}
            organization={initialData.organization}
            params={{orgId: 'org-slug', dashboardId: '1'}}
            router={initialData.router}
            location={initialData.router.location}
          >
            {null}
          </ViewEditDashboard>
        </OrganizationContext.Provider>,
        {context: initialData.routerContext}
      );

      // Enter edit mode.
      await userEvent.click(await screen.findByRole('button', {name: 'Edit Dashboard'}));
      expect(screen.queryByRole('button', {name: 'Add widget'})).not.toBeInTheDocument();
    });

    it('renders successfully if more widgets than stored layouts', async function () {
      // A case where someone has async added widgets to a dashboard
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(
          [
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:error',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'First Widget',
              interval: '1d',
              id: '1',
              layout: {x: 0, y: 0, w: 2, h: 6, minH: 0},
            }),
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:error',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'Second Widget',
              interval: '1d',
              id: '2',
            }),
          ],
          {id: '1', title: 'Custom Errors'}
        ),
      });

      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      expect(await screen.findByText('First Widget')).toBeInTheDocument();
      expect(await screen.findByText('Second Widget')).toBeInTheDocument();
    });

    it('does not trigger request if layout not updated', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(
          [
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:error',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'First Widget',
              interval: '1d',
              id: '1',
              layout: {x: 0, y: 0, w: 2, h: 6, minH: 0},
            }),
          ],
          {id: '1', title: 'Custom Errors'}
        ),
      });

      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await userEvent.click(await screen.findByText('Edit Dashboard'));
      await userEvent.click(await screen.findByText('Save and Finish'));

      expect(screen.getByText('Edit Dashboard')).toBeInTheDocument();
      expect(mockPut).not.toHaveBeenCalled();
    });

    it('renders the custom resize handler for a widget', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(
          [
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:error',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'First Widget',
              interval: '1d',
              id: '1',
              layout: {x: 0, y: 0, w: 2, h: 6, minH: 0},
            }),
          ],
          {id: '1', title: 'Custom Errors'}
        ),
      });

      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await userEvent.click(await screen.findByText('Edit Dashboard'));
      const widget = screen
        .getByText('First Widget')
        .closest('.react-grid-item') as HTMLElement;
      const resizeHandle = within(widget).getByTestId('custom-resize-handle');

      expect(resizeHandle).toBeVisible();
    });

    it('does not trigger an alert when the widgets have no layout and user cancels without changes', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(
          [
            WidgetFixture({
              queries: [
                {
                  name: '',
                  conditions: 'event.type:error',
                  fields: ['count()'],
                  aggregates: ['count()'],
                  columns: [],
                  orderby: '-count()',
                },
              ],
              title: 'First Widget',
              interval: '1d',
              id: '1',
              layout: null,
            }),
          ],
          {id: '1', title: 'Custom Errors'}
        ),
      });

      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={initialData.router}
          location={initialData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await userEvent.click(await screen.findByText('Edit Dashboard'));
      await userEvent.click(await screen.findByText('Cancel'));

      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('opens the widget viewer modal using the widget id specified in the url', async () => {
      const openWidgetViewerModal = jest.spyOn(modals, 'openWidgetViewerModal');
      const widget = WidgetFixture({
        queries: [
          {
            name: '',
            conditions: 'event.type:error',
            fields: ['count()'],
            aggregates: ['count()'],
            columns: [],
            orderby: '',
          },
        ],
        title: 'First Widget',
        interval: '1d',
        id: '1',
        layout: null,
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture([widget], {id: '1', title: 'Custom Errors'}),
      });

      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1', widgetId: 1}}
          router={initialData.router}
          location={{...initialData.router.location, pathname: '/widget/123/'}}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await waitFor(() => {
        expect(openWidgetViewerModal).toHaveBeenCalledWith(
          expect.objectContaining({
            organization: initialData.organization,
            widget,
            onClose: expect.anything(),
          })
        );
      });
    });

    it('redirects user to dashboard url if widget is not found', async () => {
      const openWidgetViewerModal = jest.spyOn(modals, 'openWidgetViewerModal');
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture([], {id: '1', title: 'Custom Errors'}),
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1', widgetId: 123}}
          router={initialData.router}
          location={{...initialData.router.location, pathname: '/widget/123/'}}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      expect(await screen.findByText('All Releases')).toBeInTheDocument();

      expect(openWidgetViewerModal).not.toHaveBeenCalled();
      expect(initialData.router.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/organizations/org-slug/dashboard/1/',
          query: {},
        })
      );
    });

    it('saves a new dashboard with the page filters', async () => {
      const mockPOST = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/',
        method: 'POST',
        body: [],
      });
      render(
        <CreateDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{templateId: undefined}}
          router={initialData.router}
          location={{
            ...initialData.router.location,
            query: {
              ...initialData.router.location.query,
              statsPeriod: '7d',
              project: [2],
              environment: ['alpha', 'beta'],
            },
          }}
        >
          {null}
        </CreateDashboard>,
        {
          context: initialData.routerContext,
          organization: initialData.organization,
        }
      );

      await userEvent.click(await screen.findByText('Save and Finish'));
      expect(mockPOST).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/',
        expect.objectContaining({
          data: expect.objectContaining({
            projects: [2],
            environment: ['alpha', 'beta'],
            period: '7d',
          }),
        })
      );
    });

    it('saves a template with the page filters', async () => {
      const mockPOST = MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/',
        method: 'POST',
        body: [],
      });
      render(
        <CreateDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{templateId: 'default-template'}}
          router={initialData.router}
          location={{
            ...initialData.router.location,
            query: {
              ...initialData.router.location.query,
              statsPeriod: '7d',
              project: [2],
              environment: ['alpha', 'beta'],
            },
          }}
        >
          {null}
        </CreateDashboard>,
        {
          context: initialData.routerContext,
          organization: initialData.organization,
        }
      );

      await userEvent.click(await screen.findByText('Add Dashboard'));
      expect(mockPOST).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/',
        expect.objectContaining({
          data: expect.objectContaining({
            projects: [2],
            environment: ['alpha', 'beta'],
            period: '7d',
          }),
        })
      );
    });

    it('does not render save and cancel buttons on templates', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      render(
        <CreateDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{templateId: 'default-template'}}
          router={initialData.router}
          location={initialData.router.location}
        >
          {null}
        </CreateDashboard>,
        {
          context: initialData.routerContext,
          organization: initialData.organization,
        }
      );

      await userEvent.click(await screen.findByText('24H'));
      await userEvent.click(screen.getByText('Last 7 days'));
      await screen.findByText('7D');

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('opens the widget viewer with saved dashboard filters', async () => {
      const openWidgetViewerModal = jest.spyOn(modals, 'openWidgetViewerModal');
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          filters: {release: ['sentry-android-shop@1.2.0']},
        }),
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1', widgetId: 1}}
          router={initialData.router}
          location={{...initialData.router.location, pathname: '/widget/1/'}}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await waitFor(() => {
        expect(openWidgetViewerModal).toHaveBeenCalledWith(
          expect.objectContaining({
            dashboardFilters: {release: ['sentry-android-shop@1.2.0']},
          })
        );
      });
    });

    it('opens the widget viewer with unsaved dashboard filters', async () => {
      const openWidgetViewerModal = jest.spyOn(modals, 'openWidgetViewerModal');
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          filters: {release: ['sentry-android-shop@1.2.0']},
        }),
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={initialData.organization}
          params={{orgId: 'org-slug', dashboardId: '1', widgetId: 1}}
          router={initialData.router}
          location={{
            ...initialData.router.location,
            pathname: '/widget/1/',
            query: {release: ['unsaved-release-filter@1.2.0']},
          }}
        >
          {null}
        </ViewEditDashboard>,
        {context: initialData.routerContext, organization: initialData.organization}
      );

      await waitFor(() => {
        expect(openWidgetViewerModal).toHaveBeenCalledWith(
          expect.objectContaining({
            dashboardFilters: {release: ['unsaved-release-filter@1.2.0']},
          })
        );
      });
    });

    it('can save dashboard filters in existing dashboard', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              statsPeriod: '7d',
              release: ['sentry-android-shop@1.2.0'],
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await userEvent.click(await screen.findByText('Save'));

      expect(mockPut).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/1/',
        expect.objectContaining({
          data: expect.objectContaining({
            period: '7d',
            filters: {release: ['sentry-android-shop@1.2.0']},
          }),
        })
      );
    });

    it('can clear dashboard filters in compact select', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          title: 'Custom Errors',
          filters: {release: ['sentry-android-shop@1.2.0']},
        }),
      });

      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              statsPeriod: '7d',
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await screen.findByText('7D');
      await userEvent.click(await screen.findByText('sentry-android-shop@1.2.0'));
      await userEvent.click(screen.getAllByText('Clear')[0]);
      screen.getByText('All Releases');
      await userEvent.click(document.body);

      await waitFor(() => {
        expect(browserHistory.push).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.objectContaining({
              release: '',
            }),
          })
        );
      });
    });

    it('can save absolute time range in existing dashboard', async () => {
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              start: '2022-07-14T07:00:00',
              end: '2022-07-19T23:59:59',
              utc: 'true',
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await userEvent.click(await screen.findByText('Save'));

      expect(mockPut).toHaveBeenCalledWith(
        '/organizations/org-slug/dashboards/1/',
        expect.objectContaining({
          data: expect.objectContaining({
            start: '2022-07-14T07:00:00.000',
            end: '2022-07-19T23:59:59.000',
            utc: true,
          }),
        })
      );
    });

    it('can clear dashboard filters in existing dashboard', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              statsPeriod: '7d',
              environment: ['alpha', 'beta'],
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await screen.findByText('7D');
      await userEvent.click(await screen.findByText('All Releases'));
      await userEvent.click(screen.getByText('sentry-android-shop@1.2.0'));
      await userEvent.keyboard('{Escape}');

      await userEvent.click(screen.getByText('Cancel'));

      screen.getByText('All Releases');
      expect(browserHistory.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            project: undefined,
            statsPeriod: undefined,
            environment: undefined,
          }),
        })
      );
    });

    it('disables the Edit Dashboard button when there are unsaved filters', async () => {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-basic',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              statsPeriod: '7d',
              environment: ['alpha', 'beta'],
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      expect(await screen.findByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: 'Edit Dashboard'})).toBeDisabled();
    });

    it('ignores the order of selection of page filters to render unsaved filters', async () => {
      const testProjects = [
        ProjectFixture({id: '1', name: 'first', environments: ['alpha', 'beta']}),
        ProjectFixture({id: '2', name: 'second', environments: ['alpha', 'beta']}),
      ];

      act(() => ProjectsStore.loadInitialData(testProjects));
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/projects/',
        body: testProjects,
      });
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          title: 'Custom Errors',
          filters: {},
          environment: ['alpha', 'beta'],
        }),
      });

      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              environment: ['beta', 'alpha'], // Reversed order from saved dashboard
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await waitFor(() => expect(screen.queryAllByText('Loading\u2026')).toEqual([]));
      await userEvent.click(screen.getByRole('button', {name: 'All Envs'}));
      expect(screen.getByRole('row', {name: 'alpha'})).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(screen.getByRole('row', {name: 'beta'})).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Save and Cancel should not appear because alpha, beta is the same as beta, alpha
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('uses releases from the URL query params', async function () {
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              release: ['not-selected-1'],
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await screen.findByText(/not-selected-1/);
      screen.getByText('Save');
      screen.getByText('Cancel');
    });

    it('resets release in URL params', async function () {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/dashboards/1/',
        body: DashboardFixture(widgets, {
          id: '1',
          title: 'Custom Errors',
          filters: {
            release: ['abc'],
          },
        }),
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: {
            ...LocationFixture(),
            query: {
              release: ['not-selected-1'],
            },
          },
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await screen.findByText(/not-selected-1/);
      await userEvent.click(screen.getByText('Cancel'));

      // release isn't used in the redirect
      expect(browserHistory.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            end: undefined,
            environment: undefined,
            project: undefined,
            start: undefined,
            statsPeriod: undefined,
            utc: undefined,
          },
        })
      );
    });

    it('reflects selections in the release filter in the query params', async function () {
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-query',
          ],
        }),
        router: {
          location: LocationFixture(),
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await userEvent.click(await screen.findByText('All Releases'));
      await userEvent.click(screen.getByText('sentry-android-shop@1.2.0'));
      await userEvent.click(document.body);

      await waitFor(() => {
        expect(browserHistory.push).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.objectContaining({
              release: ['sentry-android-shop@1.2.0'],
            }),
          })
        );
      });
    });

    it('persists release selections made during search requests that do not appear in default query', async function () {
      // Default response
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            shortVersion: 'sentry-android-shop@1.2.0',
            version: 'sentry-android-shop@1.2.0',
          }),
        ],
      });
      // Mocked search results
      MockApiClient.addMockResponse({
        url: '/organizations/org-slug/releases/',
        body: [
          ReleaseFixture({
            id: '9',
            shortVersion: 'search-result',
            version: 'search-result',
          }),
        ],
        match: [MockApiClient.matchData({query: 's'})],
      });
      const testData = initializeOrg({
        organization: OrganizationFixture({
          features: [
            'global-views',
            'dashboards-basic',
            'dashboards-edit',
            'discover-basic',
            'discover-query',
          ],
        }),
        router: {
          location: LocationFixture(),
        },
      });
      render(
        <ViewEditDashboard
          {...RouteComponentPropsFixture()}
          organization={testData.organization}
          params={{orgId: 'org-slug', dashboardId: '1'}}
          router={testData.router}
          location={testData.router.location}
        >
          {null}
        </ViewEditDashboard>,
        {context: testData.routerContext, organization: testData.organization}
      );

      await userEvent.click(await screen.findByText('All Releases'));
      await userEvent.type(screen.getAllByPlaceholderText('Search\u2026')[2], 's');
      await userEvent.click(await screen.findByRole('option', {name: 'search-result'}));

      // Validate that after search is cleared, search result still appears
      expect(await screen.findByText('Latest Release(s)')).toBeInTheDocument();
      expect(screen.getByRole('option', {name: 'search-result'})).toBeInTheDocument();
    });
  });
});
