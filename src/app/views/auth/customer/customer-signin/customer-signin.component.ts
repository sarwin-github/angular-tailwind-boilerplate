import { 
  Component, 
  OnInit, 
  OnDestroy 
} from '@angular/core';
import { 
  Router, 
  ActivatedRoute 
} from '@angular/router';
import { 
  UntypedFormBuilder, 
  UntypedFormGroup, 
  Validators 
} from '@angular/forms';
import { CustomerService } from '@app-shared/services/auth/customer/customer.service'
import { mainAnimations } from '@app-shared/animations/main-animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'customer-signin',
  animations: [mainAnimations],
  templateUrl: './customer-signin.component.html',
  styleUrls: ['./customer-signin.component.scss']
})
export class CustomerSigninComponent implements OnInit {
  private req?: Subscription;
  private postReq?: Subscription;
  private customer_email: string = '';
  private customer_password : string = '';

  public customerLoginForm: UntypedFormGroup;
  public message: any = localStorage.getItem('loginMessage');
  public error: any = localStorage.getItem('loginError');
  public inputType: string = 'password';

  constructor(private router:Router, 
    private activatedRoute: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private customerService: CustomerService) { 
    this.customerLoginForm = this.formBuilder.group({
      email: [
        null, 
        Validators.compose([Validators.required, Validators.email])
      ],
      password: [
        null, 
        Validators.compose([Validators.required, Validators.minLength(6)])
      ]
    });
  }

  ngOnInit(): void {
    this.createForm();
  }

  ngOnDestroy(): void {
    localStorage.removeItem('loginError');
    localStorage.removeItem('loginMessage');

    if(this.req) this.req.unsubscribe();
    if(this.postReq) this.postReq.unsubscribe();
  }

  createForm(): void {
    // check if backend is working
    this.req = this.customerService.getCustomerLoginForm()
    .subscribe((data: any) => {
      console.log(data);
    });
  }

  loginCustomer(event: Event): void {
    //get value from form controls
    this.customer_email = this.customerLoginForm?.get('email')?.value;
    this.customer_password = this.customerLoginForm?.get('password')?.value;
    
    // initialize inputs
    let body  = {
      email: this.customer_email,
      password: this.customer_password,
    };

    // Show Spinner
    //this.spinner.show();

    // execute http post request
    this.postReq = this.customerService
    .postLogin(body)
    .subscribe((result: any) => {
      // if error then throw error result 
      if(result.error){
        window.scroll(0, 0);
        localStorage.setItem('loginError', result.error);

        this.error = localStorage.getItem('loginError');
        //this.spinner.hide();
        this.router.navigate(['/account/login']);
      } 

      // if no error, execute login validation
      else {
        let data = result;
        
        localStorage.removeItem('loginError');
        localStorage.setItem('loginMessage', 'Login was successful.');
        localStorage.setItem('token', 'Bearer ' + data.token);
        localStorage.setItem('token_authorization', data.token.replace('Bearer ', ''));
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('customer', JSON.stringify({
          _id: data.student?._id,
          name: data.student?.name,
          email: data.student?.email
        }));

        this.customerLoginForm.reset();
        this.message = localStorage.getItem('loginMessage');
        this.customerService.setCustomerLogin(true);

        // spinner ends after 2 seconds 
        setTimeout(() => {
          //this.spinner.hide();
          this.router.navigate(['/profile']);
        }, 2000);
      }
    },
    // If error in server/api temporary navigate to error page
    (err: any) => {
      //this.spinner.hide();
      localStorage.setItem('sessionError', err);
      localStorage.setItem('sessionUrl', this.router.url);
    });    
  }

  // Clear error message
  onAlertClose(): void {
    localStorage.removeItem('loginError');
    localStorage.removeItem('loginMessage');
    this.error   = undefined;
    this.message = undefined;
  }
}
