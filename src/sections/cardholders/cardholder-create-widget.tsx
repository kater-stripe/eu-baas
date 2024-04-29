import { allFakers } from "@faker-js/faker";
import {
  Alert,
  Button,
  Checkbox,
  CheckboxProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Link,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import clm from "country-locale-map";
import { Formik, Form, Field, FormikProps, FormikValues } from "formik";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React, { RefObject, useRef } from "react";

import {
  extractJsonFromResponse,
  handleResult,
  postApi,
} from "src/utils/api-helpers";
import validationSchemas from "src/utils/validation_schemas";
import { log } from "xstate";

const validCardholderCountries = (
  country: string,
): { name: string; code: string }[] => {
  if (country == "US") {
    return [{ name: "United States", code: "US" }];
  }

  if (country == "GB") {
    return [{ name: "United Kingdom", code: "GB" }];
  }

  return [
    { name: "Austria", code: "AT" },  //de_AT  =>  same
    { name: "Belgium", code: "BE" },  //fr_BE => nl_BE
    { name: "Croatia", code: "HR" },  //hr => hr_HR
    { name: "Cyprus", code: "CY" },   // => el_CY
    { name: "Estonia", code: "EE" },  // => et_EE
    { name: "Finland", code: "FI" },  // => fi_FI
    { name: "France", code: "FR" },   //fr =>fr_FR
    { name: "Germany", code: "DE" },  //de => de_DE
    { name: "Greece", code: "GR" },   //el => el_GR
    { name: "Ireland", code: "IE" },  //en_IE => en_IE
    { name: "Italy", code: "IT" },    //it => it_IT
    { name: "Latvia", code: "LV" },   //lv => it_IT
    { name: "Lithuania", code: "LT" }, // =>  lt_LT
    { name: "Luxembourg", code: "LU" }, // => fr_LU
    { name: "Malta", code: "MT" },      // => en_MT
    { name: "Netherlands", code: "NL" }, //nl => nl_NL
    { name: "Portugal", code: "PT" }, //pt_PT => same
    { name: "Slovakia", code: "SK" }, //sk => sk_SK
    { name: "Slovenia", code: "SI" }, // => si+SI
    { name: "Spain", code: "ES" }, //es => es_ES
  ];
};

const CreateCardholderForm = ({
  formRef,
  onCreate,
}: {
  formRef: RefObject<FormikProps<FormikValues>>;
  onCreate: () => void;
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  if (session == undefined) {
    throw new Error("Session is missing in the request");
  }
  const { country } = session;

  const validationSchema = (() => {
    // @begin-exclude-from-subapps
    if (country == "US") {
      // @end-exclude-from-subapps
      // @if financialProduct==embedded-finance
      return validationSchemas.cardholder.default;
      // @endif
      // @begin-exclude-from-subapps
    } else {
      // @end-exclude-from-subapps
      // @if financialProduct==expense-management
      // PSD2 requires most transactions on payment cards issued in the EU and UK
      // to be authenticated in order to proceed. This is called Strong Customer
      // Authentication[0], or SCA. Stripe typically uses 3D Secure[1] to authenticate
      // transactions, which requires a phone number to send an OTP to via SMS.
      // So phone numbers must be mandatorily collected for cardholders of cards
      // issued by EU or UK Stripe Issuing users.
      //
      // [0] https://stripe.com/docs/strong-customer-authentication
      // [1] https://stripe.com/docs/issuing/3d-secure
      return validationSchemas.cardholder.withSCA;
      // @endif
      // @begin-exclude-from-subapps
    }
    // @end-exclude-from-subapps
  })();

  const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address1: "",
    city: "",
    state: "",
    postalCode: "",
    country: country,
    accept: false,
  };

  const [errorText, setErrorText] = React.useState("");

  const handleSubmit = async (
    values: FormikValues,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  ) => {
    const response = await postApi("api/cardholders", values);
    const result = await extractJsonFromResponse(response);
    handleResult({
      result,
      onSuccess: async () => {
        await router.push("/cardholders");
        onCreate();
      },
      onError: (error) => {
        setErrorText(`Error: ${error.message}`);
      },
      onFinally: () => {
        setSubmitting(false);
      },
    });
  };

  return (
    <Formik
      innerRef={formRef}
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, touched }) => (
        <Form>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Field
                as={TextField}
                fullWidth
                required
                label="First name"
                name="firstName"
                error={touched.firstName && Boolean(errors.firstName)}
                helperText={touched.firstName && errors.firstName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                as={TextField}
                fullWidth
                required
                label="Last name"
                name="lastName"
                error={touched.lastName && Boolean(errors.lastName)}
                helperText={touched.lastName && errors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                required
                label="Email address"
                name="email"
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                required
                label="Phone number"
                name="phoneNumber"
                error={touched.phoneNumber && Boolean(errors.phoneNumber)}
                helperText={touched.phoneNumber && errors.phoneNumber}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                required
                label="Street address"
                name="address1"
                error={touched.address1 && Boolean(errors.address1)}
                helperText={touched.address1 && errors.address1}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                as={TextField}
                fullWidth
                required
                label="City"
                name="city"
                error={touched.city && Boolean(errors.city)}
                helperText={touched.city && errors.city}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                as={TextField}
                fullWidth
                required
                label="State / Province"
                name="state"
                error={touched.state && Boolean(errors.state)}
                helperText={touched.state && errors.state}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                as={TextField}
                fullWidth
                required
                label="ZIP / Postal code"
                name="postalCode"
                error={touched.postalCode && Boolean(errors.postalCode)}
                helperText={touched.postalCode && errors.postalCode}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                as={TextField}
                fullWidth
                select
                required
                label="Country"
                name="country"
                error={touched.country && Boolean(errors.country)}
                helperText={touched.country && errors.country}
              >
                {validCardholderCountries(country).map((validCountry) => (
                  <MenuItem key={validCountry.code} value={validCountry.code}>
                    {validCountry.name}
                  </MenuItem>
                ))}
              </Field>
            </Grid>
            <Grid item xs={12}>
              <FormControl error={touched.accept && Boolean(errors.accept)}>
                <Field
                  name="accept"
                  type="checkbox"
                  as={(props: CheckboxProps) => (
                    <FormControlLabel
                      control={<Checkbox {...props} />}
                      label={
                        <Typography variant="body2">
                          This cardholder has agreed to the{" "}
                          <Link href="#">
                            Example Bank Authorized User Terms
                          </Link>{" "}
                          and <Link href="#">Example Bank Privacy Policy.</Link>
                        </Typography>
                      }
                    />
                  )}
                />
                {touched.accept && errors.accept && (
                  <FormHelperText>{errors.accept.toString()}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            {errorText !== "" && (
              <Grid item xs={12}>
                <Alert severity="error">{errorText}</Alert>
              </Grid>
            )}
          </Grid>
        </Form>
      )}
    </Formik>
  );
};

const CardholderCreateWidget = () => {
  const [showModal, setShowModal] = React.useState(false);

  const formRef = useRef<FormikProps<FormikValues>>(null);

  const { data: session } = useSession();
  if (session == undefined) {
    throw new Error("Session is missing in the request");
  }
  const { country } = session;

  const handleAutofill = () => {
    const form = formRef.current;
    if (form) {
      let locale = clm.getLocaleByAlpha2(country) || "en_US";

      if (country == "ES") {
        locale = "es"
      }

      if (country == "BE") {
        locale = "fr_BE"
      }

      if (country == "FR") {
        locale = "fr"
      }


      const faker =
        allFakers[locale as keyof typeof allFakers] || allFakers["en_US"];
  
      let state;
      let zipCode;
      if (country == "US") {
        state = faker.location.state();
        zipCode = faker.location.zipCode("#####");
      } else {
        state = faker.location.county();
        zipCode = faker.location.zipCode();
      }

      const generateNamesWithMaxLength = (maxLength: number) => {
        let firstName, lastName;
        do {
          firstName = faker.person.firstName();
          lastName = faker.person.lastName();
        } while (firstName.length + lastName.length >= maxLength);
        return { firstName, lastName };
      };
      const { firstName, lastName } = generateNamesWithMaxLength(24);

      form.setValues({
        firstName: firstName,
        lastName: lastName,
        email: faker.internet.email().toLowerCase(),
        phoneNumber: faker.phone.number(),
        address1: faker.location.streetAddress(),
        city: faker.location.city(),
        state: state,
        postalCode: zipCode,
        country: country,
        accept: true,
      });
    }
  };

  const handleSubmit = async () => {
    const form = formRef.current;
    if (form) {
      form.submitForm();
    }
  };

  const handleCreate = () => {
    setShowModal(false);
  };

  return (
    <div>
      <Button onClick={() => setShowModal(true)} variant="contained">
        Create a new cardholder
      </Button>
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        id="new-cardholder-modal"
      >
        <DialogTitle>Add new cardholder</DialogTitle>
        <Divider />
        <DialogContent>
          <CreateCardholderForm formRef={formRef} onCreate={handleCreate} />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleAutofill}>Autofill with test data</Button>
          <Button
            disabled={formRef.current?.isSubmitting}
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            {formRef.current?.isSubmitting
              ? "Adding cardholder..."
              : "Add cardholder"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CardholderCreateWidget;
