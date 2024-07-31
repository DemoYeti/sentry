import abc
import logging
from collections import namedtuple
from collections.abc import Callable, Mapping, Sequence
from typing import Any

from django.http.response import HttpResponseBase
from django.utils.encoding import force_str
from rest_framework.request import Request

from sentry.auth.services.auth.model import RpcAuthProvider
from sentry.models.authidentity import AuthIdentity
from sentry.models.authprovider import AuthProvider
from sentry.models.organization import Organization
from sentry.organizations.services.organization.model import RpcOrganization
from sentry.pipeline import PipelineProvider
from sentry.users.models.user import User

from .view import AuthView, ConfigureView


class MigratingIdentityId(namedtuple("MigratingIdentityId", ["id", "legacy_id"])):
    """
    MigratingIdentityId may be used in the ``id`` field of an identity
    dictionary to facilitate migrating user identities from one identifying id
    to another.

    Context - when google oauth was initially created, the auth_identity key was simply
    the provider email. This can cause issues if the customer changes their domain name,
    and now their email is different and they're locked out of their account.
    This logic updates their id to the provider id instead.

    NOTE: this should _only_ really be relevant for google oauth implementation
    """

    __slots__ = ()

    def __str__(self) -> str:
        return force_str(self.id)


class Provider(PipelineProvider, abc.ABC):
    """
    A provider indicates how authenticate should happen for a given service,
    including its configuration and basic identity management.
    """

    is_partner = False
    requires_refresh = True
    is_saml = False

    # All auth providers by default require the sso-basic feature
    required_feature = "organizations:sso-basic"

    def __init__(self, key: str, **config: Any) -> None:
        super().__init__()
        self._key = key
        self.config = config
        self.logger = logging.getLogger(f"sentry.auth.{self.key}")

    @property
    def key(self) -> str:
        return self._key

    def get_configure_view(
        self,
    ) -> Callable[
        [Request, RpcOrganization | Organization, AuthProvider | RpcAuthProvider], HttpResponseBase
    ]:
        """
        Return the view which handles configuration (post-setup).
        """
        return ConfigureView.as_view()

    def get_auth_pipeline(self) -> Sequence[AuthView]:
        """
        Return a list of AuthView instances representing the authentication
        pipeline for this provider.
        """
        raise NotImplementedError

    def get_setup_pipeline(self) -> Sequence[AuthView]:
        """
        Return a list of AuthView instances representing the initial setup
        pipeline for this provider.

        Defaults to the defined authentication pipeline.
        """
        return self.get_auth_pipeline()

    def get_pipeline_views(self) -> Sequence[AuthView]:
        return self.get_auth_pipeline()

    # TODO: state should be Mapping[str, Any]?
    # Must be reconciled with sentry.pipeline.base.Pipeline.fetch_state
    def build_config(self, state: Any) -> Mapping[str, Any]:
        """
        Return a mapping containing provider configuration.

        - ``state`` is the resulting data captured by the pipeline
        """
        raise NotImplementedError

    def build_identity(self, state: Mapping[str, Any]) -> Mapping[str, Any]:
        """
        Return a mapping containing the identity information.

        - ``state`` is the resulting data captured by the pipeline

        >>> {
        >>>     "id": "foo@example.com",
        >>>     "email": "foo@example.com",
        >>>     "name": "Foo Bar",
        >>>     "email_verified": True,
        >>> }

        The ``email`` and ``id`` keys are required, ``name`` is optional.

        The ``id`` may be passed in as a ``MigratingIdentityId`` should the
        the id key be migrating from one value to another and have multiple
        lookup values.

        The provider is trustable and the email address is verified by the provider,
        the ``email_verified`` attribute should be set to ``True``.

        If the identity can not be constructed an ``IdentityNotValid`` error
        should be raised.
        """
        raise NotImplementedError

    def update_identity(
        self, new_data: Mapping[str, Any], current_data: Mapping[str, Any]
    ) -> Mapping[str, Any]:
        """
        When re-authenticating with a provider, the identity data may need to
        be mutated based on the previous state. An example of this is Google,
        which will not return a `refresh_token` unless the user explicitly
        goes through an approval process.

        Return the new state which should be used for an identity.
        """
        return new_data

    def refresh_identity(self, auth_identity: AuthIdentity) -> None:
        """
        Updates the AuthIdentity with any changes from upstream. The primary
        example of a change would be signalling this identity is no longer
        valid.

        If the identity is no longer valid an ``IdentityNotValid`` error should
        be raised.
        """
        raise NotImplementedError

    def can_use_scim(self, organization_id: int, user: User) -> bool:
        """
        Controls whether or not a provider can have SCIM enabled to manage users.
        By default we have this on for all providers.
        """
        return True
